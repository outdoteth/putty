const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const wethAddress =
        network.config.wethAddress || (await deployments.get("WETH9")).address;
    const chainId = await getChainId();
    const baseURI = `${
        network.config.baseUrl || "https://testing"
    }/api/tokenMetadata/${chainId}/`;
    const feeRate = 0; // 0%

    await deploy("Putty", {
        from: deployer,
        args: [wethAddress, baseURI, feeRate],
        log: true,
    });
};

module.exports.tags = ["putty"];
