const { expect } = require("chai");
const { constants } = require("ethers");
const { parseEther, arrayify } = require("ethers/lib/utils");
const { deployments, ethers, network } = require("hardhat");
const { signOrder } = require("./utils");

describe("Putty", function () {
    let Weth;
    let Putty;
    let GoldToken;
    let CryptoPunks;
    let option;

    beforeEach(async () => {
        await deployments.fixture(["Tokens", "Putty", "Abis"]);

        const { deployer, secondary } = await ethers.getNamedSigners();
        Weth = await ethers.getContract("WETH9", deployer.address);
        GoldToken = await ethers.getContract("GoldToken", deployer.address);
        SilverToken = await ethers.getContract("SilverToken", deployer.address);
        CryptoPunks = await ethers.getContract("CryptoPunks", deployer.address);
        Putty = await ethers.getContract("Putty", deployer.address);

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
                {
                    token: SilverToken.address,
                    amount: parseEther("1"),
                },
            ],
            erc721Underlying: [
                {
                    token: CryptoPunks.address,
                    tokenId: 2,
                },
                {
                    token: CryptoPunks.address,
                    tokenId: 3,
                },
            ],
        };

        for (signer of [deployer, secondary]) {
            // mint weth
            await Weth.connect(signer).approve(
                Putty.address,
                constants.MaxUint256
            );
            await signer.sendTransaction({
                value: parseEther("100"),
                to: Weth.address,
            });

            await GoldToken.mint(signer.address, parseEther("1000"));
            await GoldToken.connect(signer).approve(
                Putty.address,
                constants.MaxUint256
            );

            await SilverToken.mint(signer.address, parseEther("1000"));
            await SilverToken.connect(signer).approve(
                Putty.address,
                constants.MaxUint256
            );

            await CryptoPunks.mint(signer.address);
            await CryptoPunks.mint(signer.address);
            await CryptoPunks.connect(signer).setApprovalForAll(
                Putty.address,
                true
            );
        }
    });

    it("Should initialise", async function () {
        expect(await Putty.weth()).to.equal(Weth.address);
    });

    describe("fillBuyOrder", function () {
        it("Should fail on invalid signature", async function () {
            const { deployer } = await ethers.getNamedSigners();
            const { signature } = await signOrder(option, deployer, Putty);

            await expect(
                Putty.fillBuyOrder(option, signature, { value: option.strike })
            ).to.revertedWith("Invalid order signature");
        });

        it("Should transfer premium weth from buyer to seller", async function () {
            const { secondary, deployer } = await ethers.getNamedSigners();
            const { signature, orderHash, shortOrderHash } = await signOrder(
                option,
                secondary,
                Putty
            );

            await Putty.fillBuyOrder(option, signature, {
                value: option.strike,
            });

            // TODO: Fix this (weird bug with waffle)
            // expect(tx).to.changeTokenBalances(
            //     Weth,
            //     [deployer, secondary, Putty],
            //     [
            //         option.premium.sub(option.strike),
            //         option.premium.mul(-1),
            //         option.strike,
            //     ]
            // );

            // TODO: Fix this (waffle fails to do deep comparison)
            // expect(tx)
            //     .to.emit(Putty, "BuyFilled")
            //     .withArgs(
            //         Object.values(option),
            //         deployer.address,
            //         orderHash,
            //         shortOrderHash
            //     );

            expect(await Putty.balanceOf(secondary.address)).to.equal(1);
            expect(await Putty.ownerOf(arrayify(orderHash))).to.equal(
                secondary.address
            );
            expect(await Putty.ownerOf(arrayify(shortOrderHash))).to.equal(
                deployer.address
            );
        });

        it("Should not allow duplicate fills", async function () {
            const { secondary } = await ethers.getNamedSigners();
            const { signature } = await signOrder(option, secondary, Putty);

            await Putty.fillBuyOrder(option, signature, {
                value: option.strike,
            });
            await expect(
                Putty.fillBuyOrder(option, signature, { value: option.strike })
            ).to.be.revertedWith("Order has already been filled");
        });
    });

    describe("exercise", () => {
        beforeEach(async () => {
            const { secondary } = await ethers.getNamedSigners();

            const { signature } = await signOrder(option, secondary, Putty);

            await Putty.fillBuyOrder(option, signature, {
                value: option.strike,
            });
        });

        it("Should transfer underlying to buyer and weth to seller", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            const [deployerBalanceBefore, secondaryBalanceBefore] = [
                await GoldToken.balanceOf(deployer.address),
                await GoldToken.balanceOf(secondary.address),
            ];

            const cryptoPunkOwnerBefore = await CryptoPunks.ownerOf(2);

            await expect(() =>
                Putty.connect(secondary).exercise(option)
            ).to.changeEtherBalances(
                [Putty, secondary],
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

            const cryptoPunkOwnerAfter = await CryptoPunks.ownerOf(2);

            expect(cryptoPunkOwnerBefore).to.not.equal(cryptoPunkOwnerAfter);
            expect(cryptoPunkOwnerAfter).to.equal(deployer.address);
        });

        it("Should not exercise option if owner is different to msg.sender", async () => {
            await expect(Putty.exercise(option)).to.be.revertedWith(
                "Cannot exercise option you dont own"
            );
        });

        it("Should not exercise expired option", async () => {
            const { secondary } = await ethers.getNamedSigners();

            await network.provider.send("evm_increaseTime", [option.duration]);
            await network.provider.send("evm_mine");

            await expect(
                Putty.connect(secondary).exercise(option)
            ).to.be.revertedWith("Expired option");
        });

        it("Should not exercise option twice", async () => {
            const { secondary } = await ethers.getNamedSigners();

            await Putty.connect(secondary).exercise(option);

            await expect(
                Putty.connect(secondary).exercise(option)
            ).to.be.revertedWith("ERC721: owner query for nonexistent token");
        });

        it("Should not exercise option that doesn't exist", async () => {
            const { secondary } = await ethers.getNamedSigners();

            await expect(
                Putty.connect(secondary).exercise({
                    ...option,
                    nonce: 2,
                })
            ).to.reverted;
        });
    });

    describe("cancel", () => {
        it("Should update cancelled orders", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();
            const { orderHash } = await signOrder(option, deployer, Putty);

            await Putty.connect(secondary).cancel(option);

            expect(await Putty.cancelledOrders(arrayify(orderHash))).to.equal(
                true
            );
        });

        it("Should not fill a cancelled order", async () => {
            const { secondary } = await ethers.getNamedSigners();
            const { signature } = await signOrder(option, secondary, Putty);

            await Putty.connect(secondary).cancel(option);

            await expect(
                Putty.fillBuyOrder(option, signature, { value: option.strike })
            ).to.revertedWith("Order has been cancelled");
        });

        it("Should only allow the owner of an option to cancel", async () => {
            const { deployer } = await ethers.getNamedSigners();
            await expect(
                Putty.connect(deployer).cancel(option)
            ).to.be.revertedWith("You are not the owner");
        });
    });

    describe("expire", () => {
        beforeEach(async () => {
            const { secondary } = await ethers.getNamedSigners();
            const { signature } = await signOrder(option, secondary, Putty);

            await Putty.fillBuyOrder(option, signature, {
                value: option.strike,
            });
        });

        it("Should not fill buy order after it has expired", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            await network.provider.send("evm_increaseTime", [option.duration]);
            await network.provider.send("evm_mine");

            await expect(() => Putty.expire(option)).to.changeEtherBalances(
                [Putty, deployer],
                [option.strike.mul("-1"), option.strike]
            );

            const { signature } = await signOrder(option, secondary, Putty);

            await expect(
                Putty.fillBuyOrder(option, signature, { value: option.strike })
            ).to.be.revertedWith("Order has already been filled");
        });

        it("Should return weth to seller on expiration", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();

            await network.provider.send("evm_increaseTime", [option.duration]);
            await network.provider.send("evm_mine");

            await expect(() => Putty.expire(option)).to.changeEtherBalances(
                [Putty, deployer],
                [option.strike.mul("-1"), option.strike]
            );
        });

        it("Should not expire an option that has not been filled", async () => {
            await expect(Putty.expire({ ...option, nonce: 2 })).to.be.reverted;
        });

        it("Should only expire option if sufficient time has passed", async () => {
            await expect(Putty.expire(option)).to.be.revertedWith(
                "Option has not expired"
            );
        });

        it("Should not expire option twice", async () => {
            await network.provider.send("evm_increaseTime", [option.duration]);
            await network.provider.send("evm_mine");

            await Putty.expire(option);

            await expect(Putty.expire(option)).to.be.revertedWith(
                "ERC721: owner query for nonexistent token"
            );
        });

        it("Should not expire an option that has already been filled", async () => {
            const { secondary, deployer } = await ethers.getNamedSigners();
            await Putty.connect(secondary).exercise(option);
            await network.provider.send("evm_increaseTime", [option.duration]);
            await network.provider.send("evm_mine");

            await expect(Putty.expire(option)).to.be.revertedWith(
                "ERC721: owner query for nonexistent token"
            );
        });
    });
});
