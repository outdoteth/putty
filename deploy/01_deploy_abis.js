module.exports = async ({ getNamedAccounts, deployments, network }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("ERC20", {
        contract: "ERC20PresetMinterPauser",
        from: deployer,
        args: ["erc20", "token"],
        log: true,
    });

    await deploy("ERC721", {
        contract: "ERC721PresetMinterPauserAutoId",
        from: deployer,
        args: ["erc721", "token", "http://testing/"],
        log: true,
    });
};

module.exports.tags = ["abis"];
