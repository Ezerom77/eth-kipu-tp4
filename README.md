# eth-kipu-tp4

This repository contains TP4, following the course guidelines, which also includes a corrected version of the SimpleSwap contract with the feedback received from the last TP correction.

### Deployment URL

- https://eth-kipu-tp4.vercel.app/

### Github

- https://github.com/Ezerom77/eth-kipu-tp4

### Additional Information

- Contract addresses: 0xD6324221906efCf1775a7484F5f7cA7b5fd32Bd9 (sepolia)

### Token addresses:

- Token A: 0xF793f2189Fab2a9580D57592ffF335703dc9Ea59
- Token B: 0x67C180f58081F4a9f588Cf9a930e70f0E036bEC3

## Hardhat Test

- An ERC20 contract is created for testing purposes in the main contract as two tokens are required for its operation

### Test Explanation

The `SimpleSwap.test.js` file contains tests to verify the correct functioning of the SimpleSwap contract. Each section is explained step by step:

#### 1. Initial Setup

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

#### explanation:

- Three test accounts are obtained: owner, user1, and user2
- Two test ERC20 tokens (tokenA and tokenB) are deployed using the TestERC20 contract
- The SimpleSwap contract is deployed with the token addresses
- Tokens are transferred to test users so they can interact with the contract
- A deadline is set for transactions (1 hour in the future)

#### 2. Deployment Tests

```javascript
describe("Deployment", function () {
  it("This should set the tokens correctly.", async function () {
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

#### explanation:

- Verifies that the tokens have been set correctly in the contract
- Checks that the token order follows the "lower address first" rule implemented in the constructor

#### 3. Add Liquidity Tests

```javascript
it("This should add initial liquidity correctly.", async function () {
  const amountA = ethers.parseEther("100");
  const amountB = ethers.parseEther("200");

  // Approve tokens for the contract
  await tokenA.connect(user1).approve(await simpleSwap.getAddress(), amountA);
  await tokenB.connect(user1).approve(await simpleSwap.getAddress(), amountB);

  // Add liquidity
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

  // Verify emitted event
  const receipt = await tx.wait();
  const event = receipt.logs.find((log) => {
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
```

#### explanation:

- Defines token amounts to add as initial liquidity
- Approves token spending by the SimpleSwap contract
- Calls the addLiquidity function to add liquidity
- Verifies that the LiquidityAdded event is emitted
- Checks that the contract's reserves are updated correctly
- Verifies that liquidity tokens are issued to the user

#### 3.2 Add Additional Liquidity

```javascript
it("This should add additional liquidity proportionally", async function () {
  // First add initial liquidity
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

  // Then add more liquidity with user2
  const additionalAmountA = ethers.parseEther("50"); // Half of initial liquidity of A
  const additionalAmountB = ethers.parseEther("100"); // Half of initial liquidity of B

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
```

#### explanation:

- First adds initial liquidity with user1
- Then adds additional liquidity with user2 maintaining the same ratio (1:2)
- Verifies that reserves are updated correctly by adding both contributions
- Checks that user2 receives liquidity tokens

#### 4. Remove Liquidity Tests

```javascript
it("Should remove liquidity correctly", async function () {
  // First add liquidity
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

  // Get liquidity balance
  const liquidityBalance = await simpleSwap.balanceOf(user1.address);

  // Approve liquidity tokens for burning
  await simpleSwap
    .connect(user1)
    .approve(await simpleSwap.getAddress(), liquidityBalance);

  // Initial token balances
  const initialTokenABalance = await tokenA.balanceOf(user1.address);
  const initialTokenBBalance = await tokenB.balanceOf(user1.address);

  // Remove all liquidity
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
```

#### explanation:

- First adds liquidity to the contract
- Gets the user's liquidity token balance
- Approves spending of liquidity tokens by the contract
- Records initial token balances
- Calls the removeLiquidity function to withdraw all liquidity
- Verifies that tokens have been returned to the user
- Checks that the contract's reserves are empty

#### 5. Token Swap Tests

### 5.1 Setup for Swaps

```javascript
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
```

#### explanation:

- Adds initial liquidity to the contract to enable swap operations
- Uses large amounts (1000 ETH of each token) to minimize the impact of swaps in tests

#### 5.2 Swap Token A for Token B

```javascript
it("Should swap token A for token B", async function () {
  const amountIn = ethers.parseEther("10");
  const path = [await tokenA.getAddress(), await tokenB.getAddress()];

  // Calculate expected output amount
  const [reserveA, reserveB] = await simpleSwap.getReserves(
    await tokenA.getAddress(),
    await tokenB.getAddress()
  );
  const expectedAmountOut = await simpleSwap.getAmountOut(
    amountIn,
    reserveA,
    reserveB
  );

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
```

#### explanation:

- Defines the amount of token A to swap and the swap path
- Calculates the expected amount of token B to receive using the getAmountOut function
- Approves spending of token A by the contract
- Records initial token balances
- Executes the swap by calling swapExactTokensForTokens
- Verifies that final balances correctly reflect the exchange

#### 5.3 Swap Token B for Token A

```javascript
it("Should swap token B for token A", async function () {
  const amountIn = ethers.parseEther("10");
  const path = [await tokenB.getAddress(), await tokenA.getAddress()];

  // Calculate expected output amount
  const [reserveB, reserveA] = await simpleSwap.getReserves(
    await tokenB.getAddress(),
    await tokenA.getAddress()
  );
  const expectedAmountOut = await simpleSwap.getAmountOut(
    amountIn,
    reserveB,
    reserveA
  );

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
```

#### explanation:

- Similar to the previous test but swapping token B for token A
- Verifies that the swap works in both directions

#### 6. View Functions Tests

#### 6.1 Setup for View Functions

```javascript
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
```

#### explanation:

- Adds liquidity with a specific ratio (1:2) to test view functions

#### 6.2 getPrice Test

```javascript
it("Should get the correct price", async function () {
  const price = await simpleSwap.getPrice(
    await tokenA.getAddress(),
    await tokenB.getAddress()
  );

  // Price should be 2 (with 18 decimals) since we have 200 B for 100 A
  expect(price).to.equal(ethers.parseEther("2"));
});
```

#### explanation:

- Calls the getPrice function to get the price of tokenA in terms of tokenB
- Verifies that the price is 2 (with 18 decimals) since there are 200 tokens B for 100 tokens A

#### 6.3 getAmountOut Test

```javascript
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
```

#### explanation:

- Calls the getAmountOut function to calculate the amount of token B to receive
- Performs the same calculation manually using the x\*y=k formula
- Verifies that both calculations match

## SimpleSwap WebApp

- https://eth-kipu-tp4.vercel.app/

#### Main Features

- Wallet Connection: Integration with MetaMask for managing transactions and user authentication.
- Token Exchange: Allows exchange between two predefined ERC20 tokens:

  - Token A: `config.js`
  - Token B: `config.js`

#### Swap Functionalities:

- Token balance display
- Real-time exchange price calculation
- Estimation of tokens to receive
- Liquidity pool reserves display
- Bidirectional swap (A→B or B→A)

#### Technical Features

- Slippage Protection: Implements a protection mechanism by setting a minimum of tokens to receive (95% of estimated)
- State Management: Uses React Hooks to handle state and side effects
- Error Handling: Robust error handling system and user feedback
- Real-time Updates: Balances and prices update automatically

#### Security

- Liquidity verification before executing swaps
- Token approval (approve) before exchanges
- Transaction timeout (20 minutes)
- Input and application state validation

#### User Interface

- Intuitive interface for exchanges
- Button to reverse swap direction
- Clear display of:
  - Connected account
  - Token balances
  - Current prices
  - Pool reserves
  - Success/error messages

#### Requirements

- MetaMask installed in the browser
- ERC20 tokens in the wallet to perform exchanges
- Connection to Ethereum network (Sepolia testnet)
