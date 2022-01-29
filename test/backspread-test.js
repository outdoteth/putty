const { expect } = require("chai");
const { constants } = require("ethers");
const {
    parseEther,
    arrayify,
    defaultAbiCoder,
    keccak256,
} = require("ethers/lib/utils");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

const signOrder = async (option, signer, Backspread, isShort = false) => {
    const domainSeparatorV4 = await Backspread.domainSeparatorV4();
    const orderHash = keccak256(
        defaultAbiCoder.encode(
            ["bytes32", "uint", "uint", "uint", "address", "uint"],
            [
                domainSeparatorV4,
                option.strike,
                option.duration,
                option.premium,
                option.owner,
                option.nonce,
            ]
        )
    );

    const shortOrderHash = keccak256(
        defaultAbiCoder.encode(
            ["bytes32", "uint", "uint", "uint", "address", "uint", "bool"],
            [
                domainSeparatorV4,
                option.strike,
                option.duration,
                option.premium,
                option.owner,
                option.nonce,
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

    beforeEach(async () => {
        await deployments.fixture(["WETH9", "Backspread"]);

        let { deployer, secondary } = await getNamedAccounts();
        Weth = await ethers.getContract("WETH9", deployer);
        Backspread = await ethers.getContract("Backspread", deployer);

        ({ deployer, secondary } = await ethers.getNamedSigners());

        // mint weth
        await deployer.sendTransaction({
            value: parseEther("100"),
            to: Weth.address,
        });

        await Weth.connect(deployer).approve(
            Backspread.address,
            constants.MaxUint256
        );

        await secondary.sendTransaction({
            value: parseEther("100"),
            to: Weth.address,
        });

        await Weth.connect(secondary).approve(
            Backspread.address,
            constants.MaxUint256
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

            expect(tx)
                .to.emit(Backspread, "BuyFilled")
                .withArgs(
                    Object.values(option),
                    deployer.address,
                    orderHash,
                    shortOrderHash
                );

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
});
