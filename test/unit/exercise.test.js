const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { getFixture } = require("../shared/fixture");
const { signOrder } = require("../utils");

describe("exercise", () => {
    beforeEach(async function () {
        const fixture = await getFixture();

        Weth = fixture.Weth;
        Putty = fixture.Putty;
        GoldToken = fixture.GoldToken;
        CryptoPunks = fixture.CryptoPunks;

        option = fixture.option;

        const { secondary } = await ethers.getNamedSigners();
        const { signature } = await signOrder(option, secondary, Putty);

        await Putty.fillBuyOrder(option, signature, {
            value: option.strike,
        });

        feeRate = await Putty.feeRate();
    });

    it("Should burn long NFT token and short NFT token", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        const { orderHash: longTokenId, shortOrderHash: shortTokenId } =
            await signOrder(option, secondary, Putty);

        // act
        await Putty.connect(secondary).exercise(option);

        // assert
        await expect(Putty.ownerOf(longTokenId)).to.be.revertedWith(
            "ERC721: owner query for nonexistent token"
        );

        await expect(Putty.ownerOf(shortTokenId)).to.be.revertedWith(
            "ERC721: owner query for nonexistent token"
        );
    });

    it("Should keep order filled after exercise", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        const { orderHash } = await signOrder(option, secondary, Putty);

        // act
        await Putty.connect(secondary).exercise(option);

        // assert
        expect(await Putty.filledOrders(orderHash)).to.eq(true);
    });

    it("Should emit Exercise event", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();

        // act
        const call = Putty.connect(secondary).exercise(option);

        // assert
        await expect(call).to.emit(Putty, "Exercised");
    });

    it("Should add fees to uncollectedFees", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        const expectedUncollectedFees = option.strike.mul(feeRate).div(1000);

        // act
        await Putty.connect(secondary).exercise(option);
        const uncollectedFees = await Putty.uncollectedFees();

        // assert
        expect(uncollectedFees).to.equal(expectedUncollectedFees);
    });

    it("Should transfer strike to buyer and underlying assets to seller", async function () {
        // arrange
        const { secondary, deployer } = await ethers.getNamedSigners();
        const [deployerBalanceBefore, secondaryBalanceBefore] = [
            await GoldToken.balanceOf(deployer.address),
            await GoldToken.balanceOf(secondary.address),
        ];
        const cryptoPunkOwnerBefore = await CryptoPunks.ownerOf(2);
        const fee = option.strike.mul(feeRate).div("1000");

        // act
        const call = () => Putty.connect(secondary).exercise(option);

        // assert
        await expect(call).to.changeEtherBalances(
            [Putty, secondary],
            [option.strike.mul("-1").add(fee), option.strike.sub(fee)]
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

    it("Should not exercise option you dont own", async function () {
        const call = Putty.exercise(option);
        await expect(call).to.be.revertedWith("You don't own this option");
    });

    it("Should revert if option has expired", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        await network.provider.send("evm_increaseTime", [option.duration]);
        await network.provider.send("evm_mine");

        // act
        const call = Putty.connect(secondary).exercise(option);

        // assert
        await expect(call).to.be.revertedWith("Expired option");
    });

    it("Should not exercise option twice", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();

        // act
        await Putty.connect(secondary).exercise(option);
        const call = Putty.connect(secondary).exercise(option);

        // asser
        await expect(call).to.be.revertedWith(
            "ERC721: owner query for nonexistent token"
        );
    });

    it("Should not exercise option that doesn't exist", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();

        // act
        const call = Putty.connect(secondary).exercise({
            ...option,
            nonce: 2,
        });

        // assert
        await expect(call).to.revertedWith(
            "ERC721: owner query for nonexistent token"
        );
    });

    it("Should send underlying to short put owner and strike to long put owner", async function () {
        // arrange
        const [deployer, secondary, tertiary, quaternary] =
            await ethers.getSigners();

        const { orderHash, shortOrderHash } = await signOrder(
            option,
            secondary,
            Putty
        );

        await Putty.connect(secondary).transferFrom(
            secondary.address,
            tertiary.address,
            orderHash
        );

        await Putty.transferFrom(
            deployer.address,
            quaternary.address,
            shortOrderHash
        );

        await CryptoPunks.connect(secondary).transferFrom(
            secondary.address,
            tertiary.address,
            2
        );

        await CryptoPunks.connect(secondary).transferFrom(
            secondary.address,
            tertiary.address,
            3
        );

        const fee = option.strike.mul(await Putty.feeRate()).div("1000");

        // act
        const call = () => Putty.connect(tertiary).exercise(option);

        // assert
        await expect(call).to.changeEtherBalances(
            [tertiary, Putty],
            [option.strike.sub(fee), option.strike.mul("-1").add(fee)]
        );
        expect(await CryptoPunks.ownerOf(3)).to.eq(quaternary.address);
        expect(await CryptoPunks.ownerOf(2)).to.eq(quaternary.address);
        expect(await Putty.uncollectedFees()).to.eq(fee);
        expect(await ethers.provider.getBalance(Putty.address)).to.eq(fee);
    });
});
