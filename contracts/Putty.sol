//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/*

        ██████╗ ██╗   ██╗████████╗████████╗██╗   ██╗
        ██╔══██╗██║   ██║╚══██╔══╝╚══██╔══╝╚██╗ ██╔╝
        ██████╔╝██║   ██║   ██║      ██║    ╚████╔╝ 
        ██╔═══╝ ██║   ██║   ██║      ██║     ╚██╔╝  
        ██║     ╚██████╔╝   ██║      ██║      ██║   
        ╚═╝      ╚═════╝    ╚═╝      ╚═╝      ╚═╝   


       by out.eth and 0xtamogoyaki

*/

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Putty is
    EIP712("Putty", "v0.9"),
    ERC721("Putty Options", "OPUT"),
    // ERC721Enumerable, // Only for L2s
    ReentrancyGuard,
    Ownable
{
    using SafeERC20 for ERC20;

    event BuyFilled(Option option, address indexed seller, uint256 tokenId, uint256 shortTokenId);
    event Exercised(Option option, address indexed seller, uint256 tokenId, uint256 shortTokenId);
    event Cancelled(Option option);
    event Expired(Option option, address indexed seller, uint256 tokenId, uint256 shortTokenId);

    ERC20 public immutable weth;
    string public baseURI;

    uint256 public uncollectedFees;
    uint256 public feeRate;

    mapping(uint256 => uint256) public tokenIdToCreationTimestamp;
    mapping(uint256 => bool) public cancelledOrders;

    struct ERC20Info {
        ERC20 token;
        uint256 amount;
    }

    struct ERC721Info {
        ERC721 token;
        uint256 tokenId;
    }

    struct Option {
        uint256 strike;
        uint256 duration; // seconds
        uint256 premium;
        address owner;
        uint256 nonce;
        ERC20Info[] erc20Underlying;
        ERC721Info[] erc721Underlying;
    }

    constructor(
        ERC20 weth_,
        string memory baseURI_,
        uint256 feeRate_
    ) {
        weth = weth_;
        baseURI = baseURI_;
        feeRate = feeRate_;
    }

    /*********************
        ADMIN FUNCTIONS
    **********************/

    function setBaseURI(string calldata baseURI_) public onlyOwner {
        baseURI = baseURI_;
    }

    function setFeeRate(uint256 feeRate_) public onlyOwner {
        require(feeRate_ <= 1000, "Cannot charge greater than 100% fees");
        feeRate = feeRate_;
    }

    function withdrawFees(address recipient) public onlyOwner {
        uint256 amount = uncollectedFees;
        uncollectedFees = 0;

        (bool success, ) = recipient.call{ value: amount }("");
        require(success, "ETH transfer to seller failed");
    }

    /*********************
        LOGIC FUNCTIONS
    **********************/

    function fillBuyOrder(Option calldata option, bytes calldata signature)
        public
        payable
        nonReentrant
    {
        // *** Checks *** //

        // transfer the strike amount (WETH) from the seller -> contract
        require(msg.value >= option.strike, "Not enough eth");

        // hash the fields
        (bytes32 orderHash, bytes32 shortOrderHash) = _hashOption(option);
        (uint256 tokenId, uint256 shortTokenId) = (uint256(orderHash), uint256(shortOrderHash));

        // check the signature for the buy order
        bytes32 digest = ECDSA.toEthSignedMessageHash(orderHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == option.owner, "Invalid order signature");

        // check that the order has not been cancelled or filled already
        require(!cancelledOrders[tokenId], "Order has been cancelled");
        require(tokenIdToCreationTimestamp[tokenId] == 0, "Order has already been filled");

        // *** Effects *** //

        // save the creation timestamp for calculating the expiry date later
        tokenIdToCreationTimestamp[tokenId] = block.timestamp;

        // mint the option NFT contracts to the buyer and seller
        _mint(option.owner, tokenId);
        _mint(msg.sender, shortTokenId);

        // *** Interactions *** //

        // transfer the premium (WETH) from the buyer -> seller
        weth.transferFrom(option.owner, msg.sender, option.premium);

        emit BuyFilled(option, msg.sender, tokenId, shortTokenId);
    }

    function exercise(Option calldata option) public nonReentrant {
        // *** Checks *** //

        // hash the fields and get buyer/seller
        (bytes32 orderHash, bytes32 shortOrderHash) = _hashOption(option);
        (uint256 tokenId, uint256 shortTokenId) = (uint256(orderHash), uint256(shortOrderHash));
        (address buyer, address seller) = (ownerOf(tokenId), ownerOf(shortTokenId));

        // check that the person calling is the owner of the option
        require(buyer == msg.sender, "Cannot exercise option you dont own");
        require(
            block.timestamp <= tokenIdToCreationTimestamp[tokenId] + option.duration,
            "Expired option"
        );

        // *** Effects *** //

        // burn both the long and short tokens
        _burn(tokenId);
        _burn(shortTokenId);

        // *** Interactions *** //

        // transfer underlying erc20 assets from buyer to seller
        for (uint256 i = 0; i < option.erc20Underlying.length; i++) {
            ERC20Info memory info = option.erc20Underlying[i];
            info.token.safeTransferFrom(buyer, seller, info.amount);
        }

        // transfer underlying erc721 assets from buyer to seller
        for (uint256 i = 0; i < option.erc721Underlying.length; i++) {
            ERC721Info memory info = option.erc721Underlying[i];
            info.token.transferFrom(buyer, seller, info.tokenId);
        }

        // transfer strike (ETH) to buyer and collect our fee
        uint256 fee = (option.strike * feeRate) / 1000;
        uncollectedFees += fee;
        (bool success, ) = buyer.call{ value: option.strike - fee }("");
        require(success, "ETH transfer to buyer failed");

        emit Exercised(option, seller, tokenId, shortTokenId);
    }

    function cancel(Option calldata option) public {
        require(msg.sender == option.owner, "You are not the owner");

        (bytes32 orderHash, ) = _hashOption(option);
        uint256 tokenId = uint256(orderHash);

        cancelledOrders[tokenId] = true;

        emit Cancelled(option);
    }

    function expire(Option calldata option) public {
        // *** Checks *** //

        // hash the fields and get the seller
        (bytes32 orderHash, bytes32 shortOrderHash) = _hashOption(option);
        (uint256 tokenId, uint256 shortTokenId) = (uint256(orderHash), uint256(shortOrderHash));
        address seller = ownerOf(shortTokenId);

        require(
            block.timestamp > tokenIdToCreationTimestamp[tokenId] + option.duration,
            "Option has not expired"
        );

        // *** Effects *** //

        // burn both tokens
        _burn(tokenId);
        _burn(shortTokenId);

        // *** Interactions *** //

        // transfer strike (ETH) to seller
        (bool success, ) = seller.call{ value: option.strike }("");
        require(success, "ETH transfer to seller failed");

        emit Expired(option, seller, tokenId, shortTokenId);
    }

    /********************
        UTIL FUNCTIONS
    *********************/

    function _hashOption(Option calldata option)
        internal
        view
        returns (bytes32 orderHash, bytes32 shortOrderHash)
    {
        orderHash = keccak256(
            abi.encode(
                _domainSeparatorV4(),
                option.strike,
                option.duration,
                option.premium,
                option.owner,
                option.nonce,
                keccak256(abi.encode(option.erc20Underlying)),
                keccak256(abi.encode(option.erc721Underlying))
            )
        );

        shortOrderHash = keccak256(abi.encode(orderHash));
    }

    /**********************
        GETTER FUNCTIONS
    **********************/

    function domainSeparatorV4() public view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function filledOrders(uint256 tokenId) public view returns (bool) {
        return tokenIdToCreationTimestamp[tokenId] > 0;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /***************
        OVERRIDES
    ****************/

    // Only for L2s
    // function _beforeTokenTransfer(
    //     address from,
    //     address to,
    //     uint256 tokenId
    // ) internal override(ERC721, ERC721Enumerable) {
    //     super._beforeTokenTransfer(from, to, tokenId);
    // }

    // Only for L2s
    // function supportsInterface(bytes4 interfaceId)
    //     public
    //     view
    //     override(ERC721, ERC721Enumerable)
    //     returns (bool)
    // {
    //     return super.supportsInterface(interfaceId);
    // }
}
