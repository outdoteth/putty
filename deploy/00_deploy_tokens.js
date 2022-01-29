module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("WETH9", {
        from: deployer,
        args: [],
        log: true,
    });

    await deploy("GoldToken", {
        contract: "ERC20PresetMinterPauser",
        from: deployer,
        args: ["GoldToken", "GOLD"],
        log: true,
    });

    await deploy("SilverToken", {
        contract: "ERC20PresetMinterPauser",
        from: deployer,
        args: ["SilverToken", "SILV"],
        log: true,
    });

    await deploy("CryptoPunks", {
        contract: "ERC721PresetMinterPauserAutoId",
        from: deployer,
        args: ["CryptoPunks", "PUNK", "http://testing.com/"],
        log: true,
    });
};

module.exports.tags = ["Tokens"];
