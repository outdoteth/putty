const { constants } = require("ethers");
const { parseEther } = require("ethers/lib/utils");
const { deployments, ethers } = require("hardhat");

const getFixture = async () => {
    await deployments.fixture(["test", "putty"]);

    const [deployer, secondary, tertiary, quaternary] =
        await ethers.getSigners();

    const Weth = await ethers.getContract("WETH9", deployer.address);

    const GoldToken = await ethers.getContract("GoldToken", deployer.address);

    const SilverToken = await ethers.getContract(
        "SilverToken",
        deployer.address
    );

    const CryptoPunks = await ethers.getContract(
        "CryptoPunks",
        deployer.address
    );

    const Putty = await ethers.getContract("Putty", deployer.address);
    await Putty.setFeeRate(19); // 1.9%

    const option = {
        strike: parseEther("1"),
        duration: 60 * 60 * 24,
        premium: parseEther("0.6"),
        owner: secondary.address,
        nonce: 1,
        erc20Underlying: [
            {
                token: GoldToken.address,
                amount: parseEther("1"),
            },
            {
                token: SilverToken.address,
                amount: parseEther("1"),
            },
        ],
        erc721Underlying: [
            {
                token: CryptoPunks.address,
                tokenId: 2,
            },
            {
                token: CryptoPunks.address,
                tokenId: 3,
            },
        ],
    };

    // Mint a bunch of test ERC20s and NFTs and max approve them on Putty contract
    for (signer of [deployer, secondary, tertiary, quaternary]) {
        // mint weth
        await Weth.connect(signer).approve(Putty.address, constants.MaxUint256);
        await signer.sendTransaction({
            value: parseEther("100"),
            to: Weth.address,
        });

        await GoldToken.mint(signer.address, parseEther("1000"));
        await GoldToken.connect(signer).approve(
            Putty.address,
            constants.MaxUint256
        );

        await SilverToken.mint(signer.address, parseEther("1000"));
        await SilverToken.connect(signer).approve(
            Putty.address,
            constants.MaxUint256
        );

        await CryptoPunks.mint(signer.address);
        await CryptoPunks.mint(signer.address);
        await CryptoPunks.connect(signer).setApprovalForAll(
            Putty.address,
            true
        );
    }

    return {
        Weth,
        GoldToken,
        SilverToken,
        CryptoPunks,
        Putty,
        option,
    };
};

module.exports = {
    getFixture,
};
