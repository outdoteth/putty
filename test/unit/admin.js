const { expect } = require("chai");
const { getFixture } = require("../shared/fixture");

describe("admin", async function () {
    beforeEach(async function () {
        const fixture = await getFixture();

        Weth = fixture.Weth;
        Putty = fixture.Putty;
        GoldToken = fixture.GoldToken;
        CryptoPunks = fixture.CryptoPunks;

        option = fixture.option;
    });

    it("Should initialise", async function () {
        const weth = await Putty.weth();
        expect(weth).to.equal(Weth.address);
    });

    it("Should set feeRate", async function () {
        await Putty.setFeeRate(100);
        const feeRate = await Putty.feeRate();
        expect(feeRate).to.eq(100);
    });

    it("Should only allow admin to set feeRate", async function () {
        const { secondary } = await ethers.getNamedSigners();

        const call = Putty.connect(secondary).setFeeRate(10);

        await expect(call).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });

    it("Should set baseURI", async function () {
        await Putty.setBaseURI("http://a.random.url");
        const baseURI = await Putty.baseURI();
        expect(baseURI).to.eq("http://a.random.url");
    });

    it("Should only allow admin to set baseURI", async function () {
        const { secondary } = await ethers.getNamedSigners();

        const call = Putty.connect(secondary).setBaseURI("http://a.random.url");

        await expect(call).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });
});
