require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-gas-reporter");
require("dotenv").config();
require("hardhat-contract-sizer");

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
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 500,
                    },
                },
            },
            {
                version: "0.4.18",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 500,
                    },
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
    contractSizer: {
        runOnCompile: true,
    },
    networks: {
        optimistic: {
            url: "http://127.0.0.1:8545",
            accounts: {
                mnemonic:
                    "test test test test test test test test test test test junk",
            },
        },
        kovan: {
            wethAddress: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
            url: "https://eth-kovan.alchemyapi.io/v2/xIfGtYkBktfmzzRXTd3No1j5byeNGHOB",
            accounts: [process.env.ROPSTEN_KEY],
            tags: ["Abis", "Putty"],
        },
        optimisticKovan: {
            wethAddress: "0xbc6f6b680bc61e30db47721c6d1c5cde19c1300d",
            url: "https://opt-kovan.g.alchemy.com/v2/xIfGtYkBktfmzzRXTd3No1j5byeNGHOB",
            accounts: [process.env.ROPSTEN_KEY],
            tags: ["Abis", "Putty"],
        },
        hardhat: {
            // mining: {
            //     auto: false,
            //     interval: 10_000,
            // },
        },
    },
};
