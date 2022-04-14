const { parseEther } = require("ethers/lib/utils");

module.exports = async ({ ethers, deployments }) => {
    const { deploy } = deployments;
    const { deployer, secondary } = await ethers.getNamedSigners();

    await deploy("GoldToken", {
        contract: "ERC20PresetMinterPauser",
        from: deployer.address,
        args: ["GoldToken", "GOLD"],
        log: true,
    });

    await deploy("SilverToken", {
        contract: "ERC20PresetMinterPauser",
        from: deployer.address,
        args: ["SilverToken", "SILV"],
        log: true,
    });

    await deploy("CryptoPunks", {
        contract: "ERC721PresetMinterPauserAutoId",
        from: deployer.address,
        args: ["CryptoPunks", "PUNK", "http://testing.com/"],
        log: true,
    });

    await deploy("WETH9", {
        from: deployer.address,
        args: [],
        log: true,
    });

    // mint some weth
    const weth = await ethers.getContract("WETH9");
    await weth.connect(deployer).deposit({ value: parseEther("100") });
    await weth.connect(secondary).deposit({ value: parseEther("100") });
};

module.exports.tags = ["test"];
