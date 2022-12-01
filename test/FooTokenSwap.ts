import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const UniswapV2Factory = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const UniswapV2Router = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const UniswapV2Pair = require("@uniswap/v2-core/build/UniswapV2Pair.json");

const FOO_TOKEN_AMOUNT_TO_MINT = 1e8;
const FOO_TOKEN_LIQUIDITY_SUPPLY = 1e7;
const FOO_TOKEN_AMOUNT_EXCHANGE = 1e4;
// 1e6 == 1 USDC token
const USDC_TOKEN_AMOUNT_TO_TRANSFER = 1e7;
const USDC_TOKEN_LIQUIDITY_SUPPLY = 1e7;
const USDC_TOKEN_MIN_AMOUNT_EXCHANGE = 1e3;

describe("FooToken", function () {
  // TODO: Put to constants
  // Describe all addresses needed for the test:
  // USDC token address
  const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  const usdcWhaleAddress = "0x55FE002aefF02F77364de339a1292923A15844B8";
  // Uniswap addresses
  const uniswapV2FactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const uniswapV2RouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  async function deployFooFixture() {
    const [owner] = await ethers.getSigners();

    // Impersonate USDC token holder and trasfer 1000 to "owner"
    const usdcToken = await ethers.getContractAt("IERC20", usdcAddress);
    const usdcHolder = await ethers.getImpersonatedSigner(usdcWhaleAddress);
    await usdcToken
      .connect(usdcHolder)
      .transfer(owner.address, USDC_TOKEN_AMOUNT_TO_TRANSFER);

    const FooToken = await ethers.getContractFactory("FooToken");
    const fooToken = await FooToken.deploy(FOO_TOKEN_AMOUNT_TO_MINT);
    await fooToken.deployed();

    return { fooToken, usdcToken, owner };
  }

  describe("Deployment", function () {
    it("'owner' of the FooToken should have balance equal to token total supply ", async function () {
      const { fooToken, owner } = await loadFixture(deployFooFixture);
      const ownerBalance = await fooToken.balanceOf(owner.address);
      expect(await fooToken.totalSupply()).to.equal(ownerBalance);
    });

    it("should assign 1 USDC token to the owner", async function () {
      const { usdcToken, owner } = await loadFixture(deployFooFixture);
      const ownerBalance = await usdcToken.balanceOf(owner.address);
      expect(USDC_TOKEN_AMOUNT_TO_TRANSFER).to.equal(ownerBalance);
    });
  });

  describe("Swapping", function () {
    it("Should successfully swap FOOT token to USDC in FOOT/USDC pair", async function () {
      console.log("–– Creating new UniswapV2Pair");
      const { fooToken, usdcToken, owner } = await loadFixture(
        deployFooFixture
      );

      const uniswapV2Factory = await ethers.getContractAt(
        UniswapV2Factory.abi,
        uniswapV2FactoryAddress
      );

      // Create pair from transaction
      const pairTransaction = await uniswapV2Factory.createPair(
        usdcToken.address,
        fooToken.address
      );
      const pairReceipt = await pairTransaction.wait();
      const pairAddress = pairReceipt.events[0].args.pair;
      const pair = await ethers.getContractAt(UniswapV2Pair.abi, pairAddress);

      const uniswapV2Router = await ethers.getContractAt(
        UniswapV2Router.abi,
        uniswapV2RouterAddress
      );

      // Approve transfer to UniswapV2
      // approval makes transferFrom possible
      await fooToken.approve(
        uniswapV2RouterAddress,
        FOO_TOKEN_LIQUIDITY_SUPPLY
      );
      await usdcToken.approve(
        uniswapV2RouterAddress,
        USDC_TOKEN_LIQUIDITY_SUPPLY
      );

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const blockTimestamp = block.timestamp;
      const deadline = blockTimestamp + 60 * 20;

      console.log("–– Adding liquidity to UniswapV2Pair via UniswapV2Router");
      await uniswapV2Router.addLiquidity(
        fooToken.address,
        usdcToken.address,
        FOO_TOKEN_LIQUIDITY_SUPPLY,
        USDC_TOKEN_LIQUIDITY_SUPPLY,
        0,
        0,
        owner.address,
        deadline
      );
      expect(await pair.totalSupply()).to.equal(FOO_TOKEN_LIQUIDITY_SUPPLY);

      console.log("–– Trying to exchange FOOT token to USDC");
      const fooBalanceBefore = await fooToken.balanceOf(owner.address);
      const usdcBalanceBefore = await usdcToken.balanceOf(owner.address);

      console.log("Foo Balance before exchange:", fooBalanceBefore.toString());
      console.log(
        "USDC Balance before exchange:",
        usdcBalanceBefore.toString()
      );

      await fooToken.approve(uniswapV2RouterAddress, FOO_TOKEN_AMOUNT_EXCHANGE);
      await uniswapV2Router.swapExactTokensForTokens(
        FOO_TOKEN_AMOUNT_EXCHANGE,
        USDC_TOKEN_MIN_AMOUNT_EXCHANGE,
        [fooToken.address, usdcToken.address],
        owner.address,
        deadline
      );

      const fooBalanceAfter = await fooToken.balanceOf(owner.address);
      const usdcBalanceAfter = await usdcToken.balanceOf(owner.address);

      console.log("Foo Balance after:", fooBalanceAfter.toString());
      console.log("USDC Balance after:", usdcBalanceAfter.toString());

      expect(fooBalanceBefore.sub(fooBalanceAfter)).to.equal(
        FOO_TOKEN_AMOUNT_EXCHANGE
      );
      expect(usdcBalanceAfter).to.greaterThanOrEqual(
        USDC_TOKEN_MIN_AMOUNT_EXCHANGE
      );
    });
  });
});
