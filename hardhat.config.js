require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-gas-reporter");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.4",
                optimizer: {
                    enabled: true,
                    runs: 500,
                },
            },
            {
                version: "0.4.18",
                optimizer: {
                    enabled: true,
                    runs: 500,
                },
            },
        ],
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        secondary: {
            default: 1,
        },
    },
    gasReporter: {
        enabled: true,
    },
    networks: {
        optimistic: {
            url: "http://127.0.0.1:8545",
            accounts: {
                mnemonic:
                    "test test test test test test test test test test test junk",
            },
        },
    },
};

// 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
// 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
