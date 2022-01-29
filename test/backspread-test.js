const { expect } = require("chai");
const { constants } = require("ethers");
const {
    parseEther,
    arrayify,
    defaultAbiCoder,
    keccak256,
} = require("ethers/lib/utils");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");

const signOrder = async (option, signer, Backspread, isShort = false) => {
    const domainSeparatorV4 = await Backspread.domainSeparatorV4();
    const orderHash = keccak256(
        defaultAbiCoder.encode(
            [
                "bytes32",
                "uint",
                "uint",
                "uint",
                "address",
                "uint",
                "bytes32",
                "bytes32",
            ],
            [
                domainSeparatorV4,
                option.strike,
                option.duration,
                option.premium,
                option.owner,
                option.nonce,
                keccak256(
                    defaultAbiCoder.encode(
                        ["(address, uint)[]"],
                        [option.erc20Underlying.map((v) => [v.token, v.amount])]
                    )
                ),
                keccak256(
                    defaultAbiCoder.encode(
                        ["(address, uint)[]"],
                        [
                            option.erc721Underlying.map((v) => [
                                v.token,
                                v.tokenId,
                            ]),
                        ]
                    )
                ),
            ]
        )
    );

    const shortOrderHash = keccak256(
        defaultAbiCoder.encode(
            [
                "bytes32",
                "uint",
                "uint",
                "uint",
                "address",
                "uint",
                "bytes32",
                "bytes32",
                "bool",
            ],
            [
                domainSeparatorV4,
                option.strike,
                option.duration,
                option.premium,
                option.owner,
                option.nonce,
                keccak256(
                    defaultAbiCoder.encode(
                        ["(address, uint)[]"],
                        [option.erc20Underlying.map((v) => [v.token, v.amount])]
                    )
                ),
                keccak256(
                    defaultAbiCoder.encode(
                        ["(address, uint)[]"],
                        [
                            option.erc721Underlying.map((v) => [
                                v.token,
                                v.tokenId,
                            ]),
                        ]
                    )
                ),
                true,
            ]
        )
    );

    const signature = await signer.signMessage(arrayify(orderHash));

    return { signature, orderHash, shortOrderHash };
};

describe("Backspread", function () {
    let Weth;
    let Backspread;
    let GoldToken;
    let CryptoPunks;

    beforeEach(async () => {
        await deployments.fixture(["Tokens", "Backspread"]);

        let { deployer, secondary } = await getNamedAccounts();
        Weth = await ethers.getContract("WETH9", deployer);
        GoldToken = await ethers.getContract("GoldToken", deployer);
        CryptoPunks = await ethers.getContract("CryptoPunks", deployer);
        Backspread = await ethers.getContract("Backspread", deployer);

        ({ deployer, secondary } = await ethers.getNamedSigners());

        await Promise.all(
            [deployer, secondary].map(async (signer) => {
                // mint weth
                await Weth.connect(signer).approve(
                    Backspread.address,
                    constants.MaxUint256
                );
                await signer.sendTransaction({
                    value: parseEther("100"),
                    to: Weth.address,
                });

                await GoldToken.mint(signer.address, parseEther("1000"));
                await GoldToken.connect(signer).approve(
                    Backspread.address,
                    constants.MaxUint256
                );

                await CryptoPunks.mint(signer.address);
                await CryptoPunks.connect(signer).setApprovalForAll(
                    Backspread.address,
                    true
                );
            })
        );
    });

    it("Should initialise", async function () {
        expect(await Backspread.weth()).to.equal(Weth.address);
    });

    describe("fillBuyOrder", function () {
        it("Should fail on invalid signature", async function () {
            const { secondary, deployer } = await ethers.getNamedSigners();

            const option = {
                strike: parseEther("1"),
                duration: 60 * 60 * 24,
                premium: parseEther("0.6"),
                owner: secondary.address,
                nonce: 1,
                erc20Underlying: [],
                erc721Underlying: [],
            };

            const { signature } = await signOrder(option, deployer, Backspread);

            await expect(
                Backspread.fillBuyOrder(option, signature)
            ).to.revertedWith("Invalid order signature");
        });

        it("Should transfer premium weth from buyer to seller", async function () {
            const { secondary, deployer } = await ethers.getNamedSigners();

            const option = {
                strike: parseEther("1"),
                duration: 60 * 60 * 24,
                premium: parseEther("0.6"),
                owner: secondary.address,
                nonce: 1,
                erc20Underlying: [],
                erc721Underlying: [],
            };

            const { signature, orderHash, shortOrderHash } = await signOrder(
                option,
                secondary,
                Backspread
            );

            const tx = await Backspread.fillBuyOrder(option, signature);

            // TODO: Fix this (weird bug with waffle)
            // expect(tx).to.changeTokenBalances(
            //     Weth,
            //     [deployer, secondary, Backspread],
            //     [
            //         option.premium.sub(option.strike),
            //         option.premium.mul(-1),
            //         option.strike,
            //     ]
            // );

            // TODO: Fix this (waffle fails to do deep comparison)
            // expect(tx)
            //     .to.emit(Backspread, "BuyFilled")
            //     .withArgs(
            //         Object.values(option),
            //         deployer.address,
            //         orderHash,
            //         shortOrderHash
            //     );

            expect(await Backspread.balanceOf(secondary.address)).to.equal(1);
            expect(await Backspread.ownerOf(arrayify(orderHash))).to.equal(
                secondary.address
            );
            expect(await Backspread.ownerOf(arrayify(shortOrderHash))).to.equal(
                deployer.address
            );
        });

        it("Should not allow duplicate fills", async function () {
            const { secondary, deployer } = await ethers.getNamedSigners();

            const option = {
                strike: parseEther("1"),
                duration: 60 * 60 * 24,
                premium: parseEther("0.6"),
                owner: secondary.address,
                nonce: 1,
                erc20Underlying: [],
                erc721Underlying: [],
            };

            const { signature } = await signOrder(
                option,
                secondary,
                Backspread
            );

            await Backspread.fillBuyOrder(option, signature);
            await expect(
                Backspread.fillBuyOrder(option, signature)
            ).to.be.revertedWith("ERC721: token already minted");
        });
    });

    describe("exercise", () => {
        let option;

        beforeEach(async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            option = {
                strike: parseEther("1"),
                duration: 60 * 60 * 24,
                premium: parseEther("0.6"),
                owner: secondary.address,
                nonce: 1,
                erc20Underlying: [
                    {
                        token: GoldToken.address,
                        amount: parseEther("1"),
                    },
                ],
                erc721Underlying: [
                    {
                        token: CryptoPunks.address,
                        tokenId: 1,
                    },
                ],
            };

            const { signature } = await signOrder(
                option,
                secondary,
                Backspread
            );

            await Backspread.fillBuyOrder(option, signature);
        });

        it("Should transfer underlying to buyer and weth to seller", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            const [deployerBalanceBefore, secondaryBalanceBefore] = [
                await GoldToken.balanceOf(deployer.address),
                await GoldToken.balanceOf(secondary.address),
            ];

            const cryptoPunkOwnerBefore = await CryptoPunks.ownerOf(1);

            await expect(() =>
                Backspread.connect(secondary).exercise(option)
            ).to.changeTokenBalances(
                Weth,
                [Backspread, secondary],
                [option.strike.mul("-1"), option.strike]
            );

            const [deployerBalanceAfter, secondaryBalanceAfter] = [
                await GoldToken.balanceOf(deployer.address),
                await GoldToken.balanceOf(secondary.address),
            ];

            expect([
                deployerBalanceAfter.sub(deployerBalanceBefore),
                secondaryBalanceAfter.sub(secondaryBalanceBefore),
            ]).to.eql([parseEther("1"), parseEther("-1")]);

            const cryptoPunkOwnerAfter = await CryptoPunks.ownerOf(1);

            expect(cryptoPunkOwnerBefore).to.not.equal(cryptoPunkOwnerAfter);
            expect(cryptoPunkOwnerAfter).to.equal(deployer.address);
        });

        it("Should not exercise option if owner is different to msg.sender", async () => {
            await expect(Backspread.exercise(option)).to.be.revertedWith(
                "Cannot exercise option you dont own"
            );
        });

        it("Should not exercise expired option", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            await network.provider.send("evm_increaseTime", [option.duration]);
            await network.provider.send("evm_mine");

            await expect(
                Backspread.connect(secondary).exercise(option)
            ).to.be.revertedWith("Expired option");
        });

        it("Should not exercise option twice", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            await Backspread.connect(secondary).exercise(option);

            await expect(
                Backspread.connect(secondary).exercise(option)
            ).to.be.revertedWith("Option has already been exercised");
        });

        it("Should not exercise option that doesn't exist", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            await expect(
                Backspread.connect(secondary).exercise({
                    ...option,
                    nonce: 2,
                })
            ).to.reverted;
        });
    });

    describe("cancel", () => {
        it("Should update cancelled orders", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            const option = {
                strike: parseEther("1"),
                duration: 60 * 60 * 24,
                premium: parseEther("0.6"),
                owner: secondary.address,
                nonce: 1,
                erc20Underlying: [],
                erc721Underlying: [],
            };

            const { orderHash } = await signOrder(option, deployer, Backspread);

            await Backspread.connect(secondary).cancel(option);

            expect(
                await Backspread.cancelledOrders(arrayify(orderHash))
            ).to.equal(true);
        });

        it("Should not fill a cancelled order", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            const option = {
                strike: parseEther("1"),
                duration: 60 * 60 * 24,
                premium: parseEther("0.6"),
                owner: secondary.address,
                nonce: 1,
                erc20Underlying: [],
                erc721Underlying: [],
            };

            const { signature } = await signOrder(
                option,
                secondary,
                Backspread
            );

            await Backspread.connect(secondary).cancel(option);

            await expect(
                Backspread.fillBuyOrder(option, signature)
            ).to.revertedWith("Order has been cancelled");
        });

        it("Should only allow the owner of an option to cancel", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            const option = {
                strike: parseEther("1"),
                duration: 60 * 60 * 24,
                premium: parseEther("0.6"),
                owner: secondary.address,
                nonce: 1,
                erc20Underlying: [],
                erc721Underlying: [],
            };

            await expect(
                Backspread.connect(deployer).cancel(option)
            ).to.be.revertedWith("You are not the owner");
        });
    });
});
