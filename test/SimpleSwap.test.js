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
    // Obtener cuentas para pruebas
    [owner, user1, user2] = await ethers.getSigners();

    // Desplegar tokens ERC20 de prueba
    const TokenFactory = await ethers.getContractFactory("TestERC20");
    tokenA = await TokenFactory.deploy("Token A", "TKA", ethers.parseEther("1000000"));
    tokenB = await TokenFactory.deploy("Token B", "TKB", ethers.parseEther("1000000"));

    // Desplegar contrato SimpleSwap
    SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy(await tokenA.getAddress(), await tokenB.getAddress());

    // Transferir tokens a usuarios de prueba
    await tokenA.transfer(user1.address, ethers.parseEther("10000"));
    await tokenB.transfer(user1.address, ethers.parseEther("10000"));
    await tokenA.transfer(user2.address, ethers.parseEther("10000"));
    await tokenB.transfer(user2.address, ethers.parseEther("10000"));

    // Establecer deadline para transacciones
    deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hora en el futuro
  });

  describe("Deployment", function () {
    it("Debería establecer los tokens correctamente", async function () {
      const tokenAAddress = await simpleSwap.tokenA();
      const tokenBAddress = await simpleSwap.tokenB();

      // Verificar que los tokens se hayan establecido en el orden correcto (menor dirección primero)
      if (await tokenA.getAddress() < await tokenB.getAddress()) {
        expect(tokenAAddress).to.equal(await tokenA.getAddress());
        expect(tokenBAddress).to.equal(await tokenB.getAddress());
      } else {
        expect(tokenAAddress).to.equal(await tokenB.getAddress());
        expect(tokenBAddress).to.equal(await tokenA.getAddress());
      }
    });
  });

  describe("Agregar liquidez", function () {
    it("Debería agregar liquidez inicial correctamente", async function () {
      const amountA = ethers.parseEther("100");
      const amountB = ethers.parseEther("200");

      // Aprobar tokens para el contrato
      await tokenA.connect(user1).approve(await simpleSwap.getAddress(), amountA);
      await tokenB.connect(user1).approve(await simpleSwap.getAddress(), amountB);

      // Agregar liquidez
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

      // Verificar evento emitido
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return simpleSwap.interface.parseLog(log).name === "LiquidityAdded";
        } catch (e) {
          return false;
        }
      });
      expect(event).to.not.be.undefined;

      // Verificar balances
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      expect(reserveA).to.equal(amountA);
      expect(reserveB).to.equal(amountB);

      // Verificar tokens de liquidez
      const liquidityBalance = await simpleSwap.balanceOf(user1.address);
      expect(liquidityBalance).to.be.gt(0);
    });

    it("Debería agregar liquidez adicional proporcionalmente", async function () {
      // Primero agregar liquidez inicial
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

      // Luego agregar más liquidez con user2
      const additionalAmountA = ethers.parseEther("50"); // La mitad de la liquidez inicial de A
      const additionalAmountB = ethers.parseEther("100"); // La mitad de la liquidez inicial de B

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

      // Verificar reservas actualizadas
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      expect(reserveA).to.equal(initialAmountA + additionalAmountA);
      expect(reserveB).to.equal(initialAmountB + additionalAmountB);

      // Verificar tokens de liquidez para user2
      const liquidityBalance = await simpleSwap.balanceOf(user2.address);
      expect(liquidityBalance).to.be.gt(0);
    });
  });

  describe("Remover liquidez", function () {
    it("Debería remover liquidez correctamente", async function () {
      // Primero agregar liquidez
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

      // Obtener balance de liquidez
      const liquidityBalance = await simpleSwap.balanceOf(user1.address);

      // Aprobar tokens de liquidez para quemar
      await simpleSwap.connect(user1).approve(await simpleSwap.getAddress(), liquidityBalance);

      // Balances iniciales de tokens
      const initialTokenABalance = await tokenA.balanceOf(user1.address);
      const initialTokenBBalance = await tokenB.balanceOf(user1.address);

      // Remover toda la liquidez
      await simpleSwap.connect(user1).removeLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        liquidityBalance,
        0,
        0,
        user1.address,
        deadline
      );

      // Verificar que los tokens se hayan devuelto
      const finalTokenABalance = await tokenA.balanceOf(user1.address);
      const finalTokenBBalance = await tokenB.balanceOf(user1.address);

      expect(finalTokenABalance).to.be.gt(initialTokenABalance);
      expect(finalTokenBBalance).to.be.gt(initialTokenBBalance);

      // Verificar que las reservas estén vacías
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      expect(reserveA).to.equal(0);
      expect(reserveB).to.equal(0);
    });
  });

  describe("Swap de tokens", function () {
    beforeEach(async function () {
      // Agregar liquidez para permitir swaps
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

    it("Debería intercambiar tokens A por tokens B", async function () {
      const amountIn = ethers.parseEther("10");
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];

      // Calcular cantidad esperada de salida
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      const expectedAmountOut = await simpleSwap.getAmountOut(amountIn, reserveA, reserveB);

      // Aprobar tokens para el swap
      await tokenA.connect(user1).approve(await simpleSwap.getAddress(), amountIn);

      // Balances iniciales
      const initialTokenABalance = await tokenA.balanceOf(user1.address);
      const initialTokenBBalance = await tokenB.balanceOf(user1.address);

      // Ejecutar swap
      await simpleSwap.connect(user1).swapExactTokensForTokens(
        amountIn,
        0, // Sin mínimo
        path,
        user1.address,
        deadline
      );

      // Verificar balances finales
      const finalTokenABalance = await tokenA.balanceOf(user1.address);
      const finalTokenBBalance = await tokenB.balanceOf(user1.address);

      expect(initialTokenABalance - finalTokenABalance).to.equal(amountIn);
      expect(finalTokenBBalance - initialTokenBBalance).to.equal(expectedAmountOut);
    });

    it("Debería intercambiar tokens B por tokens A", async function () {
      const amountIn = ethers.parseEther("10");
      const path = [await tokenB.getAddress(), await tokenA.getAddress()];

      // Calcular cantidad esperada de salida
      const [reserveB, reserveA] = await simpleSwap.getReserves(
        await tokenB.getAddress(),
        await tokenA.getAddress()
      );
      const expectedAmountOut = await simpleSwap.getAmountOut(amountIn, reserveB, reserveA);

      // Aprobar tokens para el swap
      await tokenB.connect(user1).approve(await simpleSwap.getAddress(), amountIn);

      // Balances iniciales
      const initialTokenABalance = await tokenA.balanceOf(user1.address);
      const initialTokenBBalance = await tokenB.balanceOf(user1.address);

      // Ejecutar swap
      await simpleSwap.connect(user1).swapExactTokensForTokens(
        amountIn,
        0, // Sin mínimo
        path,
        user1.address,
        deadline
      );

      // Verificar balances finales
      const finalTokenABalance = await tokenA.balanceOf(user1.address);
      const finalTokenBBalance = await tokenB.balanceOf(user1.address);

      expect(initialTokenBBalance - finalTokenBBalance).to.equal(amountIn);
      expect(finalTokenABalance - initialTokenABalance).to.equal(expectedAmountOut);
    });
  });

  describe("Funciones de vista", function () {
    beforeEach(async function () {
      // Agregar liquidez para probar funciones de vista
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

    it("Debería obtener el precio correcto", async function () {
      const price = await simpleSwap.getPrice(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );

      // El precio debería ser 2 (con 18 decimales) ya que tenemos 200 B por 100 A
      expect(price).to.equal(ethers.parseEther("2"));
    });

    it("Debería calcular correctamente la cantidad de salida", async function () {
      const amountIn = ethers.parseEther("10");
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );

      const amountOut = await simpleSwap.getAmountOut(amountIn, reserveA, reserveB);

      // Verificar cálculo manual
      const numerator = amountIn * reserveB;
      const denominator = reserveA + amountIn;
      const expectedAmountOut = numerator / denominator;

      expect(amountOut).to.equal(expectedAmountOut);
    });
  });
});