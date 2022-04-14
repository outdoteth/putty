const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { arrayify } = require("ethers/lib/utils");
const { ethers, deployments } = require("hardhat");
const { getFixture } = require("../shared/fixture");
const { signOrder } = require("../utils");

describe("fillBuyOrder", function () {
    beforeEach(async function () {
        const fixture = await getFixture();

        Weth = fixture.Weth;
        Putty = fixture.Putty;
        GoldToken = fixture.GoldToken;
        CryptoPunks = fixture.CryptoPunks;

        option = fixture.option;
    });

    it("Should emit BuyFilled event", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        const { signature } = await signOrder(option, secondary, Putty);

        // act
        const call = Putty.fillBuyOrder(option, signature, {
            value: option.strike,
        });

        // assert
        await expect(call).to.emit(Putty, "BuyFilled");
    });

    it("Should mint long option NFT to buyer", async function () {
        // arrange
        const { secondary, deployer } = await ethers.getNamedSigners();
        const { signature, orderHash: longOptionTokenId } = await signOrder(
            option,
            secondary,
            Putty
        );

        // act
        await Putty.connect(deployer).fillBuyOrder(option, signature, {
            value: option.strike,
        });

        // assert
        expect(await Putty.balanceOf(secondary.address)).to.equal(1);
        expect(await Putty.ownerOf(longOptionTokenId)).to.equal(
            secondary.address
        );
    });

    it("Should mint short option NFT to seller", async function () {
        // arrange
        const { secondary, deployer } = await ethers.getNamedSigners();
        const { signature, shortOrderHash: shortOptionTokenId } =
            await signOrder(option, secondary, Putty);

        // act
        await Putty.connect(deployer).fillBuyOrder(option, signature, {
            value: option.strike,
        });

        // assert
        expect(await Putty.balanceOf(deployer.address)).to.equal(1);
        expect(await Putty.ownerOf(shortOptionTokenId)).to.equal(
            deployer.address
        );
    });

    it("Should revert if msg.value is less than strike", async function () {
        // arrange
        const { secondary, deployer } = await ethers.getNamedSigners();
        const { signature } = await signOrder(option, secondary, Putty);

        // act
        const call = Putty.connect(deployer).fillBuyOrder(option, signature, {
            value: option.strike.sub("1"),
        });

        // assert
        await expect(call).to.be.revertedWith("Not enough eth");
    });

    it("Should set option creation timestamp", async function () {
        // arrange
        const { secondary, deployer } = await ethers.getNamedSigners();
        const { signature, orderHash: longOptionTokenId } = await signOrder(
            option,
            secondary,
            Putty
        );

        // act
        await Putty.connect(deployer).fillBuyOrder(option, signature, {
            value: option.strike,
        });
        const { timestamp } = await ethers.provider.getBlock();

        // assert
        expect(
            await Putty.tokenIdToCreationTimestamp(longOptionTokenId)
        ).to.equal(timestamp);
    });

    it("Should fail on invalid signature", async function () {
        const { deployer } = await ethers.getNamedSigners();
        const { signature } = await signOrder(option, deployer, Putty);

        const call = Putty.fillBuyOrder(option, signature, {
            value: option.strike,
        });

        await expect(call).to.revertedWith("Invalid order signature");
    });

    it("Should transfer premium weth from buyer to seller", async function () {
        // arrange
        const { secondary, deployer } = await ethers.getNamedSigners();
        const { signature, orderHash, shortOrderHash } = await signOrder(
            option,
            secondary,
            Putty
        );

        // act
        const call = () =>
            Putty.fillBuyOrder(option, signature, {
                value: option.strike,
            });

        // assert
        await expect(call).to.changeTokenBalances(
            Weth,
            [deployer, secondary],
            [option.premium, option.premium.mul(-1)]
        );
    });

    it("Should revert if order has already been filled", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        const { signature } = await signOrder(option, secondary, Putty);

        // act
        await Putty.fillBuyOrder(option, signature, {
            value: option.strike,
        });

        const call = Putty.fillBuyOrder(option, signature, {
            value: option.strike,
        });

        // assert
        await expect(call).to.be.revertedWith("Order has already been filled");
    });

    it("Should mark order as filled", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        const { signature, orderHash } = await signOrder(
            option,
            secondary,
            Putty
        );

        // act
        const beforeFilled = await Putty.filledOrders(orderHash);
        await Putty.fillBuyOrder(option, signature, {
            value: option.strike,
        });
        const afterFilled = await Putty.filledOrders(orderHash);

        // assert
        expect(beforeFilled).to.eq(false);
        expect(afterFilled).to.eq(true);
    });

    it("Should return correct tokenURI for minted option NFTs", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        const baseURI = await Putty.baseURI();
        const { signature, orderHash, shortOrderHash } = await signOrder(
            option,
            secondary,
            Putty
        );

        const expectedLongTokenURI =
            baseURI + BigNumber.from(orderHash).toString();
        const expectedShortTokenURI =
            baseURI + BigNumber.from(shortOrderHash).toString();

        // act
        await Putty.fillBuyOrder(option, signature, {
            value: option.strike,
        });

        const longTokenURI = await Putty.tokenURI(orderHash);
        const shortTokenURI = await Putty.tokenURI(shortOrderHash);

        // assert
        expect(longTokenURI).to.eq(expectedLongTokenURI);
        expect(shortTokenURI).to.eq(expectedShortTokenURI);
    });
});
