//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Backspread is
    EIP712("Backspread", "v0.9"),
    ERC721("Backspread Options", "BACKO"),
    ReentrancyGuard
{
    event BuyFilled(Option _option, address indexed buyer, uint256 tokenId, uint256 shortTokenId);

    ERC20 public weth;

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

    constructor(ERC20 weth_) {
        weth = weth_;
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

        shortOrderHash = keccak256(
            abi.encode(
                _domainSeparatorV4(),
                option.strike,
                option.duration,
                option.premium,
                option.owner,
                option.nonce,
                keccak256(abi.encode(option.erc20Underlying)),
                keccak256(abi.encode(option.erc721Underlying)),
                true // marks it as short (prevent hash collision)
            )
        );
    }

    function fillBuyOrder(Option memory option, bytes memory signature) public nonReentrant {
        // hash the fields
        (bytes32 orderHash, bytes32 shortOrderHash) = _hashOption(option);

        // check the signature
        bytes32 digest = ECDSA.toEthSignedMessageHash(orderHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == option.owner, "Invalid order signature");

        // mint the option NFT to buyer
        uint256 tokenId = uint256(orderHash);
        _safeMint(option.owner, tokenId);
        tokenIdToCreationTimestamp[tokenId] = block.timestamp;

        require(!cancelledOrders[tokenId], "Order has been cancelled");

        // mint the short option NFT to seller
        uint256 shortTokenId = uint256(shortOrderHash);
        _safeMint(msg.sender, shortTokenId);

        // transfer the premium (WETH) from the buyer -> seller
        weth.transferFrom(option.owner, msg.sender, option.premium);

        // transfer the strike amount (WETH) from the seller -> contract
        weth.transferFrom(msg.sender, address(this), option.strike);

        emit BuyFilled(option, msg.sender, tokenId, shortTokenId);
    }

    function exercise(Option memory option) public nonReentrant {
        (bytes32 orderHash, bytes32 shortOrderHash) = _hashOption(option);
        (uint256 tokenId, uint256 shortTokenId) = (uint256(orderHash), uint256(shortOrderHash));
        (address buyer, address seller) = (ownerOf(tokenId), ownerOf(shortTokenId));

        // check that the person calling is the owner of the option
        require(buyer == msg.sender, "Cannot exercise option you dont own");
        require(tokenIdToCreationTimestamp[tokenId] > 0, "Option has already been exercised");
        require(
            block.timestamp <= tokenIdToCreationTimestamp[tokenId] + option.duration,
            "Expired option"
        );

        tokenIdToCreationTimestamp[tokenId] = 0;

        // transfer strike (WETH) to buyer
        weth.transfer(buyer, option.strike);

        // transfer underlying erc20 assets from buyer to seller
        for (uint256 i = 0; i < option.erc20Underlying.length; i++) {
            ERC20Info memory info = option.erc20Underlying[i];
            info.token.transferFrom(buyer, seller, info.amount);
        }

        // transfer underlying erc721 assets from buyer to seller
        for (uint256 i = 0; i < option.erc721Underlying.length; i++) {
            ERC721Info memory info = option.erc721Underlying[i];
            info.token.transferFrom(buyer, seller, info.tokenId);
        }
    }

    function cancel(Option memory option) public {
        require(msg.sender == option.owner, "You are not the owner");

        (bytes32 orderHash, ) = _hashOption(option);
        uint256 tokenId = uint256(orderHash);

        cancelledOrders[tokenId] = true;
    }

    function expire(Option memory option) public {
        (bytes32 orderHash, bytes32 shortOrderHash) = _hashOption(option);
        (uint256 tokenId, uint256 shortTokenId) = (uint256(orderHash), uint256(shortOrderHash));
        address seller = ownerOf(shortTokenId);

        require(_exists(tokenId), "Option does not exist"); // TODO: Can this check be removed?
        require(
            block.timestamp > tokenIdToCreationTimestamp[tokenId] + option.duration,
            "Option has not expired"
        );
        require(
            tokenIdToCreationTimestamp[tokenId] > 0,
            "Option has been exercised or already cleared"
        );

        tokenIdToCreationTimestamp[tokenId] = 0;

        weth.transfer(seller, option.strike);
    }
}
