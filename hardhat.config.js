require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-gas-reporter");
require("dotenv").config();
require("hardhat-contract-sizer");
require("@primitivefi/hardhat-dodoc");
require("solidity-coverage");

const HARDHAT_DEFAULT_PRIVATE_KEY =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

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
            // apiKey: process.env.ETHERSCAN_KEY,
            apiKey: process.env.OPTIMISM_ETHERSCAN_KEY,
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
        mainnet: {
            wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            url: "https://eth-mainnet.alchemyapi.io/v2/k23IS-WoFyk1VVAvgGXnYlNvTrdQCv-1",
            accounts: [
                process.env.MAINNET_PRIVATE_KEY || HARDHAT_DEFAULT_PRIVATE_KEY,
            ],
        },
        optimisticEthereum: {
            baseUrl: "https://dev.putty.finance",
            wethAddress: "0x4200000000000000000000000000000000000006",
            url: "https://opt-mainnet.g.alchemy.com/v2/_lGA7RCvsFNDuuYRxKMq9Rhbz0zfd-Io",
            accounts: [
                process.env.MAINNET_PRIVATE_KEY || HARDHAT_DEFAULT_PRIVATE_KEY,
            ],
        },
        kovan: {
            wethAddress: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
            url: "https://eth-kovan.alchemyapi.io/v2/xIfGtYkBktfmzzRXTd3No1j5byeNGHOB",
            accounts: [
                process.env.TESTNET_PRIVATE_KEY || HARDHAT_DEFAULT_PRIVATE_KEY,
            ],
            tags: ["putty"],
        },
        rinkeby: {
            wethAddress: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
            url: "https://eth-rinkeby.g.alchemy.com/v2/xIfGtYkBktfmzzRXTd3No1j5byeNGHOB",
            accounts: [
                process.env.TESTNET_PRIVATE_KEY || HARDHAT_DEFAULT_PRIVATE_KEY,
            ],
            tags: ["putty"],
            baseUrl: "https://dev.putty.finance",
        },
        optimisticKovan: {
            wethAddress: "0xbc6f6b680bc61e30db47721c6d1c5cde19c1300d",
            url: "https://opt-kovan.g.alchemy.com/v2/xIfGtYkBktfmzzRXTd3No1j5byeNGHOB",
            accounts: [
                process.env.TESTNET_PRIVATE_KEY || HARDHAT_DEFAULT_PRIVATE_KEY,
            ],
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
