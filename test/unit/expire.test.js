const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getFixture } = require("../shared/fixture");
const { signOrder } = require("../utils");

describe("expire", () => {
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
    });

    it("Should emit Expired event", async function () {
        // arrange
        await network.provider.send("evm_increaseTime", [option.duration]);
        await network.provider.send("evm_mine");

        // act
        const call = Putty.expire(option);

        // assert
        await expect(call).to.emit(Putty, "Expired");
    });

    it("Should still mark order as filled after it's expired", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        await network.provider.send("evm_increaseTime", [option.duration]);
        await network.provider.send("evm_mine");
        const { orderHash } = await signOrder(option, secondary, Putty);

        // act
        await Putty.expire(option);

        // assert
        expect(await Putty.filledOrders(orderHash)).to.eq(true);
    });

    it("Should not fill buy order after it has expired", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        await network.provider.send("evm_increaseTime", [option.duration]);
        await network.provider.send("evm_mine");
        await Putty.expire(option);

        // act
        const { signature } = await signOrder(option, secondary, Putty);
        const call = Putty.fillBuyOrder(option, signature, {
            value: option.strike,
        });

        // assert
        await expect(call).to.be.revertedWith("Order has already been filled");
    });

    it("Should return strike to owner of short NFT on expiration", async function () {
        // arrange
        const { deployer } = await ethers.getNamedSigners();
        await network.provider.send("evm_increaseTime", [option.duration]);
        await network.provider.send("evm_mine");

        // act
        const call = () => Putty.expire(option);

        // assert
        await expect(call).to.changeEtherBalances(
            [Putty, deployer],
            [option.strike.mul("-1"), option.strike]
        );
    });

    it("Should not expire an option that does not exist", async function () {
        const call = Putty.expire({ ...option, nonce: 2 });
        await expect(call).to.be.reverted;
    });

    it("Should only expire option if sufficient time has passed", async function () {
        const call = Putty.expire(option);
        await expect(call).to.be.revertedWith("Option has not expired");
    });

    it("Should not expire option twice", async function () {
        // arrange
        await network.provider.send("evm_increaseTime", [option.duration]);
        await network.provider.send("evm_mine");

        // act
        await Putty.expire(option);
        const call = Putty.expire(option);

        // assert
        await expect(call).to.be.revertedWith(
            "ERC721: owner query for nonexistent token"
        );
    });

    it("Should not expire an option that has already been exercised", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        await Putty.connect(secondary).exercise(option);

        // act
        const call = Putty.expire(option);

        // assert
        await expect(call).to.be.revertedWith(
            "ERC721: owner query for nonexistent token"
        );
    });
});
