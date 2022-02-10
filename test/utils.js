const { keccak256, defaultAbiCoder, arrayify } = require("ethers/lib/utils");

const signOrder = async (option, signer, Putty, isShort = false) => {
    const domainSeparatorV4 = await Putty.domainSeparatorV4();

    const optionTypes = [
        "bytes32",
        "uint",
        "uint",
        "uint",
        "address",
        "uint",
        "bytes32",
        "bytes32",
    ];

    const hashedErc20Underlying = keccak256(
        defaultAbiCoder.encode(
            ["(address, uint)[]"],
            [option.erc20Underlying.map((v) => [v.token, v.amount])]
        )
    );

    const hashedErc721Underlying = keccak256(
        defaultAbiCoder.encode(
            ["(address, uint)[]"],
            [option.erc721Underlying.map((v) => [v.token, v.tokenId])]
        )
    );

    const orderHash = keccak256(
        defaultAbiCoder.encode(optionTypes, [
            domainSeparatorV4,
            option.strike,
            option.duration,
            option.premium,
            option.owner,
            option.nonce,
            hashedErc20Underlying,
            hashedErc721Underlying,
        ])
    );

    const shortOrderHash = keccak256(
        defaultAbiCoder.encode(["bytes32"], [orderHash])
    );

    const signature = await signer.signMessage(arrayify(orderHash));

    return { signature, orderHash, shortOrderHash };
};

module.exports = { signOrder };
