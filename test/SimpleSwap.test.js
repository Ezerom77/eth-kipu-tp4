const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let SimpleSwap;
  let simpleSwap;
  let TokenA;
  let tokenA;
  let TokenB;
  let tokenB;
  let owner;
  let user1;
  let user2;
  let deadline;

  beforeEach(async function () {
    // Get accounts for testing
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy test ERC20 tokens
    const TokenFactory = await ethers.getContractFactory("TestERC20");
    tokenA = await TokenFactory.deploy("Token A", "TKA", ethers.parseEther("1000000"));
    tokenB = await TokenFactory.deploy("Token B", "TKB", ethers.parseEther("1000000"));

    // Deploy SimpleSwap contract
    SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy(await tokenA.getAddress(), await tokenB.getAddress());

    // Transfer tokens to test users
    await tokenA.transfer(user1.address, ethers.parseEther("10000"));
    await tokenB.transfer(user1.address, ethers.parseEther("10000"));
    await tokenA.transfer(user2.address, ethers.parseEther("10000"));
    await tokenB.transfer(user2.address, ethers.parseEther("10000"));

    // Set deadline for transactions
    deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
  });

  describe("Deployment", function () {
    it("This should set the tokens correctly.", async function () {
      const tokenAAddress = await simpleSwap.tokenA();
      const tokenBAddress = await simpleSwap.tokenB();

      // Verify that tokens have been set in the correct order (lower address first)
      if (await tokenA.getAddress() < await tokenB.getAddress()) {
        expect(tokenAAddress).to.equal(await tokenA.getAddress());
        expect(tokenBAddress).to.equal(await tokenB.getAddress());
      } else {
        expect(tokenAAddress).to.equal(await tokenB.getAddress());
        expect(tokenBAddress).to.equal(await tokenA.getAddress());
      }
    });
  });

  describe("Add initial liquidity", function () {
    it("This should add initial liquidity correctly.", async function () {
      const amountA = ethers.parseEther("100");
      const amountB = ethers.parseEther("200");

      // Approve tokens for the contract
      await tokenA.connect(user1).approve(await simpleSwap.getAddress(), amountA);
      await tokenB.connect(user1).approve(await simpleSwap.getAddress(), amountB);

      // Add liquidity
      const tx = await simpleSwap.connect(user1).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0,
        0,
        user1.address,
        deadline
      );

      // Verify emitted event
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return simpleSwap.interface.parseLog(log).name === "LiquidityAdded";
        } catch (e) {
          return false;
        }
      });
      expect(event).to.not.be.undefined;

      // Verify balances
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      expect(reserveA).to.equal(amountA);
      expect(reserveB).to.equal(amountB);

      // Verify liquidity tokens
      const liquidityBalance = await simpleSwap.balanceOf(user1.address);
      expect(liquidityBalance).to.be.gt(0);
    });

    it("This should add additional liquidity proportionally", async function () {
      // First add initial liquidity
      const initialAmountA = ethers.parseEther("100");
      const initialAmountB = ethers.parseEther("200");

      await tokenA.connect(user1).approve(await simpleSwap.getAddress(), initialAmountA);
      await tokenB.connect(user1).approve(await simpleSwap.getAddress(), initialAmountB);

      await simpleSwap.connect(user1).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        initialAmountA,
        initialAmountB,
        0,
        0,
        user1.address,
        deadline
      );

      // Then add more liquidity with user2
      const additionalAmountA = ethers.parseEther("50"); // Half of initial liquidity of A
      const additionalAmountB = ethers.parseEther("100"); // Half of initial liquidity of B

      await tokenA.connect(user2).approve(await simpleSwap.getAddress(), additionalAmountA);
      await tokenB.connect(user2).approve(await simpleSwap.getAddress(), additionalAmountB);

      await simpleSwap.connect(user2).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        additionalAmountA,
        additionalAmountB,
        0,
        0,
        user2.address,
        deadline
      );

      // Verify updated reserves
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      expect(reserveA).to.equal(initialAmountA + additionalAmountA);
      expect(reserveB).to.equal(initialAmountB + additionalAmountB);

      // Verify liquidity tokens for user2
      const liquidityBalance = await simpleSwap.balanceOf(user2.address);
      expect(liquidityBalance).to.be.gt(0);
    });
  });

  describe("Remove liquidity", function () {
    it("Should remove liquidity correctly", async function () {
      // First add liquidity
      const amountA = ethers.parseEther("100");
      const amountB = ethers.parseEther("200");

      await tokenA.connect(user1).approve(await simpleSwap.getAddress(), amountA);
      await tokenB.connect(user1).approve(await simpleSwap.getAddress(), amountB);

      await simpleSwap.connect(user1).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0,
        0,
        user1.address,
        deadline
      );

      // Get liquidity balance
      const liquidityBalance = await simpleSwap.balanceOf(user1.address);

      // Approve liquidity tokens for burning
      await simpleSwap.connect(user1).approve(await simpleSwap.getAddress(), liquidityBalance);

      // Initial token balances
      const initialTokenABalance = await tokenA.balanceOf(user1.address);
      const initialTokenBBalance = await tokenB.balanceOf(user1.address);

      // Remove all liquidity
      await simpleSwap.connect(user1).removeLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        liquidityBalance,
        0,
        0,
        user1.address,
        deadline
      );

      // Verify that tokens have been returned
      const finalTokenABalance = await tokenA.balanceOf(user1.address);
      const finalTokenBBalance = await tokenB.balanceOf(user1.address);

      expect(finalTokenABalance).to.be.gt(initialTokenABalance);
      expect(finalTokenBBalance).to.be.gt(initialTokenBBalance);

      // Verify that reserves are empty
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      expect(reserveA).to.equal(0);
      expect(reserveB).to.equal(0);
    });
  });

  describe("Token swap", function () {
    beforeEach(async function () {
      // Add liquidity to allow swaps
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("1000");

      await tokenA.connect(owner).approve(await simpleSwap.getAddress(), amountA);
      await tokenB.connect(owner).approve(await simpleSwap.getAddress(), amountB);

      await simpleSwap.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0,
        0,
        owner.address,
        deadline
      );
    });

    it("Should swap token A for token B", async function () {
      const amountIn = ethers.parseEther("10");
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];

      // Calculate expected output amount
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      const expectedAmountOut = await simpleSwap.getAmountOut(amountIn, reserveA, reserveB);

      // Approve tokens for swap
      await tokenA.connect(user1).approve(await simpleSwap.getAddress(), amountIn);

      // Initial balances
      const initialTokenABalance = await tokenA.balanceOf(user1.address);
      const initialTokenBBalance = await tokenB.balanceOf(user1.address);

      // Execute swap
      await simpleSwap.connect(user1).swapExactTokensForTokens(
        amountIn,
        0, // No minimum
        path,
        user1.address,
        deadline
      );

      // Verify final balances
      const finalTokenABalance = await tokenA.balanceOf(user1.address);
      const finalTokenBBalance = await tokenB.balanceOf(user1.address);

      expect(initialTokenABalance - finalTokenABalance).to.equal(amountIn);
      expect(finalTokenBBalance - initialTokenBBalance).to.equal(expectedAmountOut);
    });

    it("Should swap token B for token A", async function () {
      const amountIn = ethers.parseEther("10");
      const path = [await tokenB.getAddress(), await tokenA.getAddress()];

      // Calculate expected output amount
      const [reserveB, reserveA] = await simpleSwap.getReserves(
        await tokenB.getAddress(),
        await tokenA.getAddress()
      );
      const expectedAmountOut = await simpleSwap.getAmountOut(amountIn, reserveB, reserveA);

      // Approve tokens for swap
      await tokenB.connect(user1).approve(await simpleSwap.getAddress(), amountIn);

      // Initial balances
      const initialTokenABalance = await tokenA.balanceOf(user1.address);
      const initialTokenBBalance = await tokenB.balanceOf(user1.address);

      // Execute swap
      await simpleSwap.connect(user1).swapExactTokensForTokens(
        amountIn,
        0, // No minimum
        path,
        user1.address,
        deadline
      );

      // Verify final balances
      const finalTokenABalance = await tokenA.balanceOf(user1.address);
      const finalTokenBBalance = await tokenB.balanceOf(user1.address);

      expect(initialTokenBBalance - finalTokenBBalance).to.equal(amountIn);
      expect(finalTokenABalance - initialTokenABalance).to.equal(expectedAmountOut);
    });
  });

  describe("View functions", function () {
    beforeEach(async function () {
      // Add liquidity to test view functions
      const amountA = ethers.parseEther("100");
      const amountB = ethers.parseEther("200");

      await tokenA.connect(owner).approve(await simpleSwap.getAddress(), amountA);
      await tokenB.connect(owner).approve(await simpleSwap.getAddress(), amountB);

      await simpleSwap.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0,
        0,
        owner.address,
        deadline
      );
    });

    it("Should get the correct price", async function () {
      const price = await simpleSwap.getPrice(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );

      // Price should be 2 (with 18 decimals) since we have 200 B for 100 A
      expect(price).to.equal(ethers.parseEther("2"));
    });

    it("Should calculate output amount correctly", async function () {
      const amountIn = ethers.parseEther("10");
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );

      const amountOut = await simpleSwap.getAmountOut(amountIn, reserveA, reserveB);

      // Verify manual calculation
      const numerator = amountIn * reserveB;
      const denominator = reserveA + amountIn;
      const expectedAmountOut = numerator / denominator;

      expect(amountOut).to.equal(expectedAmountOut);
    });
  });
});