//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Putty is
    EIP712("Putty", "v0.9"),
    ERC721("Putty Options", "OPUT"),
    ERC721Enumerable,
    ReentrancyGuard
{
    using SafeERC20 for ERC20;

    event BuyFilled(Option _option, address indexed buyer, uint256 tokenId, uint256 shortTokenId);

    ERC20 public weth;
    string public baseURI;

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

    constructor(ERC20 weth_, string memory baseURI_) {
        weth = weth_;
        baseURI = baseURI_;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function domainSeparatorV4() public view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function _hashOption(Option memory option)
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

    function filledOrders(uint256 tokenId) public view returns (bool) {
        return tokenIdToCreationTimestamp[tokenId] > 0;
    }

    function fillBuyOrder(Option memory option, bytes memory signature)
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

        // check the signature
        bytes32 digest = ECDSA.toEthSignedMessageHash(orderHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == option.owner, "Invalid order signature");

        // Check that the order has not been cancelled or filled already
        require(!cancelledOrders[tokenId], "Order has been cancelled");
        require(tokenIdToCreationTimestamp[tokenId] == 0, "Order has already been filled");

        // *** Effects *** //

        // mark the creation of the contract for calculating the expiry date
        tokenIdToCreationTimestamp[tokenId] = block.timestamp;

        // mint the option NFT contracts to the buyer and seller
        _mint(option.owner, tokenId);
        _mint(msg.sender, shortTokenId);

        // *** Interactions *** //

        // transfer the premium (WETH) from the buyer -> seller
        weth.transferFrom(option.owner, msg.sender, option.premium);

        emit BuyFilled(option, msg.sender, tokenId, shortTokenId);
    }

    function exercise(Option memory option) public nonReentrant {
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

        // transfer strike (ETH) to buyer
        (bool success, ) = buyer.call{ value: option.strike }("");
        require(success, "ETH transfer to buyer failed");
    }

    function cancel(Option memory option) public {
        require(msg.sender == option.owner, "You are not the owner");

        (bytes32 orderHash, ) = _hashOption(option);
        uint256 tokenId = uint256(orderHash);

        cancelledOrders[tokenId] = true;
    }

    function expire(Option memory option) public {
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

        // transfer strike (ETH) to buyer
        (bool success, ) = seller.call{ value: option.strike }("");
        require(success, "ETH transfer to seller failed");
    }
}
