# eth-kipu-tp4

# Contract addresses : 0xD6324221906efCf1775a7484F5f7cA7b5fd32Bd9 (sepolia)

# Token addresses :

- Token A: 0xF793f2189Fab2a9580D57592ffF335703dc9Ea59
- Token B: 0x67C180f58081F4a9f588Cf9a930e70f0E036bEC3

# Test

- se crea un contrato de ERC20 con fines de testeo en contrato principal ya que se requieren dos tokens para su funcionamiento

## Explicación Detallada del Archivo de Test

El archivo `SimpleSwap.test.js` contiene pruebas exhaustivas para verificar el correcto funcionamiento del contrato SimpleSwap. A continuación se explica paso a paso cada sección:

### 1. Configuración Inicial (Setup)

```javascript
beforeEach(async function () {
  // Obtener cuentas para pruebas
  [owner, user1, user2] = await ethers.getSigners();

  // Desplegar tokens ERC20 de prueba
  const TokenFactory = await ethers.getContractFactory("TestERC20");
  tokenA = await TokenFactory.deploy(
    "Token A",
    "TKA",
    ethers.parseEther("1000000")
  );
  tokenB = await TokenFactory.deploy(
    "Token B",
    "TKB",
    ethers.parseEther("1000000")
  );

  // Desplegar contrato SimpleSwap
  SimpleSwap = await ethers.getContractFactory("SimpleSwap");
  simpleSwap = await SimpleSwap.deploy(
    await tokenA.getAddress(),
    await tokenB.getAddress()
  );

  // Transferir tokens a usuarios de prueba
  await tokenA.transfer(user1.address, ethers.parseEther("10000"));
  await tokenB.transfer(user1.address, ethers.parseEther("10000"));
  await tokenA.transfer(user2.address, ethers.parseEther("10000"));
  await tokenB.transfer(user2.address, ethers.parseEther("10000"));

  // Establecer deadline para transacciones
  deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hora en el futuro
});
```

#### explicacion:

- Se obtienen tres cuentas de prueba: owner , user1 y user2
- Se despliegan dos tokens ERC20 de prueba ( tokenA y tokenB ) utilizando el contrato TestERC20
- Se despliega el contrato SimpleSwap con las direcciones de los tokens
- Se transfieren tokens a los usuarios de prueba para que puedan interactuar con el contrato
- Se establece un deadline para las transacciones
  (1 hora en el futuro)

### 2. Pruebas de Despliegue (Deployment)

```javascript
describe("Deployment", function () {
  it("Debería establecer los tokens correctamente", async function () {
    const tokenAAddress = await simpleSwap.tokenA();
    const tokenBAddress = await simpleSwap.tokenB();

    // Verificar que los tokens se hayan establecido en el orden correcto (menor dirección primero)
    if ((await tokenA.getAddress()) < (await tokenB.getAddress())) {
      expect(tokenAAddress).to.equal(await tokenA.getAddress());
      expect(tokenBAddress).to.equal(await tokenB.getAddress());
    } else {
      expect(tokenAAddress).to.equal(await tokenB.getAddress());
      expect(tokenBAddress).to.equal(await tokenA.getAddress());
    }
  });
});
```

#### explicacion:

- Verifica que los tokens se hayan establecido correctamente en el contrato
- Comprueba que el orden de los tokens siga la regla de "dirección menor primero" implementada en el constructor

### 3. Pruebas de Agregar Liquidez

```javascript
it("Debería agregar liquidez inicial correctamente", async function () {
  const amountA = ethers.parseEther("100");
  const amountB = ethers.parseEther("200");

  // Aprobar tokens para el contrato
  await tokenA.connect(user1).approve(await simpleSwap.getAddress(), amountA);
  await tokenB.connect(user1).approve(await simpleSwap.getAddress(), amountB);

  // Agregar liquidez
  const tx = await simpleSwap
    .connect(user1)
    .addLiquidity(
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
  const event = receipt.logs.find((log) => {
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
```

#### explicacion:

- Define cantidades de tokens para agregar como liquidez inicial
- Aprueba el gasto de tokens por parte del contrato SimpleSwap
- Llama a la función addLiquidity para agregar liquidez
- Verifica que se emita el evento LiquidityAdded
- Comprueba que las reservas del contrato se actualicen correctamente
- Verifica que se hayan emitido tokens de liquidez al usuario

### 3.2 Agregar Liquidez Adicional

```javascript
it("Debería agregar liquidez adicional proporcionalmente", async function () {
  // Primero agregar liquidez inicial
  const initialAmountA = ethers.parseEther("100");
  const initialAmountB = ethers.parseEther("200");

  await tokenA
    .connect(user1)
    .approve(await simpleSwap.getAddress(), initialAmountA);
  await tokenB
    .connect(user1)
    .approve(await simpleSwap.getAddress(), initialAmountB);

  await simpleSwap
    .connect(user1)
    .addLiquidity(
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

  await tokenA
    .connect(user2)
    .approve(await simpleSwap.getAddress(), additionalAmountA);
  await tokenB
    .connect(user2)
    .approve(await simpleSwap.getAddress(), additionalAmountB);

  await simpleSwap
    .connect(user2)
    .addLiquidity(
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
```

#### explicacion:

- Primero agrega liquidez inicial con user1
- Luego agrega liquidez adicional con user2 manteniendo la misma proporción (1:2)
- Verifica que las reservas se actualicen correctamente sumando ambas contribuciones
- Comprueba que user2 reciba tokens de liquidez

### 4. Pruebas de Remover Liquidez

```javascript
it("Debería remover liquidez correctamente", async function () {
  // Primero agregar liquidez
  const amountA = ethers.parseEther("100");
  const amountB = ethers.parseEther("200");

  await tokenA.connect(user1).approve(await simpleSwap.getAddress(), amountA);
  await tokenB.connect(user1).approve(await simpleSwap.getAddress(), amountB);

  await simpleSwap
    .connect(user1)
    .addLiquidity(
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
  await simpleSwap
    .connect(user1)
    .approve(await simpleSwap.getAddress(), liquidityBalance);

  // Balances iniciales de tokens
  const initialTokenABalance = await tokenA.balanceOf(user1.address);
  const initialTokenBBalance = await tokenB.balanceOf(user1.address);

  // Remover toda la liquidez
  await simpleSwap
    .connect(user1)
    .removeLiquidity(
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
```

#### explicacion:

- Primero agrega liquidez al contrato
- Obtiene el balance de tokens de liquidez del usuario
- Aprueba el gasto de tokens de liquidez por parte del contrato
- Registra los balances iniciales de tokens
- Llama a la función removeLiquidity para retirar toda la liquidez
- Verifica que los tokens se hayan devuelto al usuario
- Comprueba que las reservas del contrato estén vacías

### 5. Pruebas de Swap de Tokens

### 5.1 Configuración para Swaps

```javascript
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
```

#### explicacion:

- Agrega liquidez inicial al contrato para permitir operaciones de swap
- Utiliza cantidades grandes (1000 ETH de cada token) para minimizar el impacto de los swaps en las pruebas

### 5.2 Swap de Token A por Token B

```javascript
it("Debería intercambiar tokens A por tokens B", async function () {
  const amountIn = ethers.parseEther("10");
  const path = [await tokenA.getAddress(), await tokenB.getAddress()];

  // Calcular cantidad esperada de salida
  const [reserveA, reserveB] = await simpleSwap.getReserves(
    await tokenA.getAddress(),
    await tokenB.getAddress()
  );
  const expectedAmountOut = await simpleSwap.getAmountOut(
    amountIn,
    reserveA,
    reserveB
  );

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
```

#### explicacion:

- Define la cantidad de tokens A a intercambiar y la ruta del swap
- Calcula la cantidad esperada de tokens B a recibir usando la función getAmountOut
- Aprueba el gasto de tokens A por parte del contrato
- Registra los balances iniciales de tokens
- Ejecuta el swap llamando a swapExactTokensForTokens
- Verifica que los balances finales reflejen correctamente el intercambio

### 5.3 Swap de Token B por Token A

```javascript
it("Debería intercambiar tokens B por tokens A", async function () {
  const amountIn = ethers.parseEther("10");
  const path = [await tokenB.getAddress(), await tokenA.getAddress()];

  // Calcular cantidad esperada de salida
  const [reserveB, reserveA] = await simpleSwap.getReserves(
    await tokenB.getAddress(),
    await tokenA.getAddress()
  );
  const expectedAmountOut = await simpleSwap.getAmountOut(
    amountIn,
    reserveB,
    reserveA
  );

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
```

#### explicacion:

- Similar al test anterior pero intercambiando tokens B por tokens A
- Verifica que el swap funcione en ambas direcciones

### 6. Pruebas de Funciones de Vista

### 6.1 Configuración para Funciones de Vista

```javascript
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
```

#### explicacion:

- Agrega liquidez con una proporción específica (1:2) para probar las funciones de vista

### 6.2 Prueba de getPrice

```javascript
it("Debería obtener el precio correcto", async function () {
  const price = await simpleSwap.getPrice(
    await tokenA.getAddress(),
    await tokenB.getAddress()
  );

  // El precio debería ser 2 (con 18 decimales) ya que tenemos 200 B por 100 A
  expect(price).to.equal(ethers.parseEther("2"));
});
```

#### explicacion:

- Llama a la función getPrice para obtener el precio de tokenA en términos de tokenB
- Verifica que el precio sea 2 (con 18 decimales) ya que hay 200 tokens B por 100 tokens A

### 6.3 Prueba de getAmountOut

```javascript
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
```

#### explicacion:

- Llama a la función getAmountOut para calcular la cantidad de tokens B a recibir
- Realiza el mismo cálculo manualmente usando la fórmula x\*y=k
- Verifica que ambos cálculos coincidan
