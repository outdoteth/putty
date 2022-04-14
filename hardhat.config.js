require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-gas-reporter");
require("dotenv").config();
require("hardhat-contract-sizer");
require("@primitivefi/hardhat-dodoc");
require("solidity-coverage");
require("@nomiclabs/hardhat-solhint");

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.4",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100_000,
                    },
                },
            },
            {
                version: "0.4.18",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100_000,
                    },
                },
            },
        ],
    },
    dodoc: {
        runOnCompile: false,
        debugMode: true,
        include: ["contracts/Putty.sol"],
    },
    verify: {
        etherscan: {
            apiKey: process.env.ETHERSCAN_KEY,
            // apiKey: process.env.OPTIMISM_ETHERSCAN_KEY,
        },
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
            accounts: [process.env.TESTNET_PRIVATE_KEY],
            tags: ["putty"],
        },
        rinkeby: {
            wethAddress: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
            url: "https://eth-rinkeby.g.alchemy.com/v2/xIfGtYkBktfmzzRXTd3No1j5byeNGHOB",
            accounts: [process.env.TESTNET_PRIVATE_KEY],
            tags: ["putty"],
            baseUrl: "https://dev.putty.finance",
        },
        optimisticKovan: {
            wethAddress: "0xbc6f6b680bc61e30db47721c6d1c5cde19c1300d",
            url: "https://opt-kovan.g.alchemy.com/v2/xIfGtYkBktfmzzRXTd3No1j5byeNGHOB",
            accounts: [process.env.TESTNET_PRIVATE_KEY],
            tags: ["putty"],
            baseUrl: "https://dev.putty.finance",
        },
        localhost: {
            tags: ["test", "putty"],
            // mining: {
            //     auto: false,
            //     interval: 500,
            // },
        },
    },
};
