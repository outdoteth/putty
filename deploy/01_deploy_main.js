module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const weth = await deployments.get("WETH9");

    await deploy("Backspread", {
        from: deployer,
        args: [weth.address],
        log: true,
    });
};

module.exports.tags = ["Backspread"];
