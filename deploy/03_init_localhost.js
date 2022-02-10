const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer, secondary } = await ethers.getNamedSigners();

    const weth = await ethers.getContract("WETH9");
    await weth.connect(deployer).deposit({ value: parseEther("100") });
    await weth.connect(secondary).deposit({ value: parseEther("100") });
};

module.exports.tags = ["Init"];
