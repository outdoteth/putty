const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { getFixture } = require("../shared/fixture");
const { signOrder } = require("../utils");

describe("fees", async function () {
    const fillBuyOrderAndExercise = async (option) => {
        const { secondary } = await ethers.getNamedSigners();
        const { signature } = await signOrder(option, secondary, Putty);
        await Putty.fillBuyOrder(option, signature, {
            value: option.strike,
        });

        await Putty.connect(secondary).exercise(option);
    };

    beforeEach(async function () {
        const fixture = await getFixture();

        Weth = fixture.Weth;
        Putty = fixture.Putty;
        GoldToken = fixture.GoldToken;
        CryptoPunks = fixture.CryptoPunks;

        option = fixture.option;
    });

    it("Should not set feeRate greater than 100%", async function () {
        const call = Putty.setFeeRate(1001);
        await expect(call).to.be.revertedWith("Fee can't be greater than 100%");
    });

    it("Should not update uncollected fees if feeRate is set to 0", async function () {
        // arrange
        await Putty.setFeeRate(0);

        // act
        await fillBuyOrderAndExercise(option);
        const uncollectedFees = await Putty.uncollectedFees();

        // assert
        expect(uncollectedFees).to.equal(0);
    });

    it("Should withdraw uncollected fees and reset uncollectedFees", async function () {
        // arrange
        const { deployer } = await ethers.getNamedSigners();
        const feeRate = await Putty.feeRate();

        const option1 = { ...option, strike: parseEther("15") };
        const option2 = {
            ...option,
            strike: parseEther("8"),
            erc721Underlying: [],
        };
        const option3 = {
            ...option,
            strike: parseEther("2"),
            erc721Underlying: [],
        };

        // act
        await fillBuyOrderAndExercise(option1);
        await fillBuyOrderAndExercise(option2);
        await fillBuyOrderAndExercise(option3);

        const option1Fee = option1.strike.mul(feeRate).div("1000");
        const option2Fee = option2.strike.mul(feeRate).div("1000");
        const option3Fee = option3.strike.mul(feeRate).div("1000");

        const uncollectedFees = await Putty.uncollectedFees();
        const call = () => Putty.withdrawFees(deployer.address);

        // assert
        expect(uncollectedFees).to.eq(
            option1Fee.add(option2Fee).add(option3Fee)
        );

        await expect(call).to.changeEtherBalances(
            [Putty, deployer],
            [uncollectedFees.mul("-1"), uncollectedFees]
        );

        expect(await Putty.uncollectedFees()).to.eq(0);
    });

    it("Should only allow admin to withdraw fees", async function () {
        // arrange
        const { secondary } = await ethers.getNamedSigners();

        // act
        const call = Putty.connect(secondary).withdrawFees(secondary.address);

        // assert
        await expect(call).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });
});
