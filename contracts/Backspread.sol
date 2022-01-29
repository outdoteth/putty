//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract Backspread is EIP712("Backspread", "v0.9"), ERC721("Backspread Options", "BACKO"), ReentrancyGuard {
    event BuyFilled(
        Option _option,
        address indexed buyer,
        uint tokenId,
        uint shortTokenId
    );

    ERC20 public weth;

    mapping(uint => uint) public tokenIdToCreationTimestamp;
    mapping(uint => bool) public cancelledOrders;

    struct ERC20Info {
        ERC20 token;
        uint amount;
    }

    struct ERC721Info {
        ERC721 token;
        uint tokenId;
    }

    struct Option {
        uint strike;
        uint duration; // seconds
        uint premium;
        address owner;
        uint nonce;
        ERC20Info[] erc20Underlying;
        ERC721Info[] erc721Underlying;
    }

    constructor(ERC20 weth_) {   
        weth = weth_;
    }
    
    function domainSeparatorV4() public view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function hashOption(Option memory option) internal view returns (bytes32 orderHash, bytes32 shortOrderHash){
        orderHash = keccak256(abi.encode(
            _domainSeparatorV4(),
            option.strike,
            option.duration,
            option.premium,
            option.owner,
            option.nonce,
            keccak256(abi.encode(option.erc20Underlying)),
            keccak256(abi.encode(option.erc721Underlying))
        ));

        shortOrderHash = keccak256(abi.encode(
            _domainSeparatorV4(),
            option.strike,
            option.duration,
            option.premium,
            option.owner,
            option.nonce,
            keccak256(abi.encode(option.erc20Underlying)),
            keccak256(abi.encode(option.erc721Underlying)),
            true // marks it as short (prevent hash collision)
        ));
    }

    function fillBuyOrder(Option memory option, bytes memory signature) nonReentrant() public {
        // hash the fields
        (bytes32 orderHash, bytes32 shortOrderHash) = hashOption(option);

        // check the signature
        bytes32 digest = ECDSA.toEthSignedMessageHash(orderHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == option.owner, "Invalid order signature");

        // transfer the premium (WETH) from the buyer -> seller
        weth.transferFrom(option.owner, msg.sender, option.premium);

        // transfer the strike amount (WETH) from the seller -> contract
        weth.transferFrom(msg.sender, address(this), option.strike);

        // mint the option NFT to buyer
        uint tokenId = uint(orderHash);
        _safeMint(option.owner, tokenId);
        tokenIdToCreationTimestamp[tokenId] = block.timestamp;

        require(!cancelledOrders[tokenId], "Order has been cancelled");

        // mint the short option NFT to seller
        uint shortTokenId = uint(shortOrderHash);
        _safeMint(msg.sender, shortTokenId);

        emit BuyFilled(option, msg.sender, tokenId, shortTokenId);
    }

    function exercise(Option memory option) nonReentrant() public {
        (bytes32 orderHash, bytes32 shortOrderHash) = hashOption(option);
        (uint tokenId, uint shortTokenId) = (uint(orderHash),uint(shortOrderHash));
        (address buyer, address seller) = (ownerOf(tokenId), ownerOf(shortTokenId));

        // check that the person calling is the owner of the option
        require(buyer == msg.sender, "Cannot exercise option you dont own");
        require(tokenIdToCreationTimestamp[tokenId] > 0, "Option has already been exercised");
        require(block.timestamp <= tokenIdToCreationTimestamp[tokenId] + option.duration, "Expired option");

        // transfer strike (WETH) to buyer
        weth.transfer(buyer, option.strike);

        // transfer underlying erc20 assets from buyer to seller
        for (uint i = 0; i < option.erc20Underlying.length; i++) {
            ERC20Info memory info = option.erc20Underlying[i];
            info.token.transferFrom(buyer, seller, info.amount);
        }

        // transfer underlying erc721 assets from buyer to seller
        for (uint i = 0; i < option.erc721Underlying.length; i++) {
            ERC721Info memory info = option.erc721Underlying[i];
            info.token.transferFrom(buyer, seller, info.tokenId);
        }

        tokenIdToCreationTimestamp[tokenId] = 0;
    }

    function cancel(Option memory option) public {
        require(msg.sender == option.owner, "You are not the owner");

        (bytes32 orderHash, ) = hashOption(option);
        uint tokenId = uint(orderHash);
        
        cancelledOrders[tokenId] = true;
    }

    function expire() public {}
}
