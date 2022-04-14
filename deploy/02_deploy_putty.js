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
    const baseURI = `${network.config.baseUrl}/api/tokenMetadata/${chainId}/`;
    const feeRate = 19; // 1.9%

    await deploy("Putty", {
        from: deployer,
        args: [wethAddress, baseURI, feeRate],
        log: true,
    });
};

module.exports.tags = ["putty"];
