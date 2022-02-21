const { network } = require("hardhat");

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const wethAddress =
        network.config.wethAddress || (await deployments.get("WETH9")).address;
    const chainId = await getChainId();
    const baseURI = `https://dev.putty.finance/api/${chainId}/`;
    const feeRate = 20; // 2%

    await deploy("Putty", {
        from: deployer,
        args: [wethAddress, baseURI, feeRate],
        log: true,
    });
};

module.exports.tags = ["Putty"];
