//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Backspread is EIP712("Backspread", "v0.9"), ERC721("Backspread Options", "BACKO") {
    ERC20 public weth;

    struct Option {
        uint strike;
        uint duration;
        uint premium;
        address owner;
        uint nonce;
    }

    constructor(ERC20 weth_) {   
        weth = weth_;
    }

    function fillBuyOrder(Option memory option, bytes memory signature) public {
        // hash the fields
        bytes32 orderHash = keccak256(abi.encode(
            _domainSeparatorV4(),
            option.strike,
            option.duration,
            option.premium,
            option.owner,
            option.nonce
        ));

        // check the signature
        bytes32 digest = ECDSA.toEthSignedMessageHash(orderHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == option.owner, "Invalid order signature");

        // transfer the premium (WETH) from the buyer -> seller
        weth.transferFrom(option.owner, msg.sender, option.premium);

        // transfer the strike amount (WETH) from the seller -> contract
        weth.transferFrom(msg.sender, address(this), option.strike);

        // mint the option NFT to buyer
        uint256 tokenId = uint256(orderHash);
        _safeMint(option.owner, tokenId);
    }

    function exercise() public {}
    function cancel() public {}
    function expire() public {}
}
