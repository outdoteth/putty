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
    const baseURI = `https://${network.name}.putty.finance/api/token/`;

    await deploy("Putty", {
        from: deployer,
        args: [wethAddress, baseURI],
        log: true,
    });
};

module.exports.tags = ["Putty"];
