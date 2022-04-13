const { expect } = require("chai");
const { arrayify } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { getFixture } = require("../shared/fixture");
const { signOrder } = require("../utils");

describe("cancel", () => {
    beforeEach(async function () {
        const fixture = await getFixture();

        Weth = fixture.Weth;
        Putty = fixture.Putty;
        GoldToken = fixture.GoldToken;
        CryptoPunks = fixture.CryptoPunks;

        option = fixture.option;
    });

    it("Should update cancelled orders", async function () {
        // arrange
        const { secondary, deployer } = await ethers.getNamedSigners();
        const { orderHash } = await signOrder(option, deployer, Putty);

        // act
        await Putty.connect(secondary).cancel(option);
        const cancelled = await Putty.cancelledOrders(arrayify(orderHash));

        // assert
        expect(cancelled).to.equal(true);
    });

    it("Should emit Cancelled event", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();

        // act
        const call = Putty.connect(secondary).cancel(option);

        // assert
        await expect(call).to.emit(Putty, "Cancelled");
    });

    it("Should not fill a cancelled order", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();
        const { signature } = await signOrder(option, secondary, Putty);

        // act
        await Putty.connect(secondary).cancel(option);
        const call = Putty.fillBuyOrder(option, signature, {
            value: option.strike,
        });

        // assert
        await expect(call).to.revertedWith("Order has been cancelled");
    });

    it("Should only allow the owner of an option to cancel", async function () {
        // arrange
        const { deployer } = await ethers.getNamedSigners();

        // act
        const call = Putty.connect(deployer).cancel(option);

        // assert
        await expect(call).to.be.revertedWith("You are not the owner");
    });
});
