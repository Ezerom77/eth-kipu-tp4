# eth-kipu-tp4

## Updated on 11/7/2025

This repository contains TP4, following the course guidelines, and includes corrections to the original code to correct the problem of multiple accesses to state variables.

### Deployment URL

- https://eth-kipu-tp4.vercel.app/

### Github

- https://github.com/Ezerom77/eth-kipu-tp4

### Additional Information

- Contract addresses: 0xF81D6568B01e6F75EC35dD87558ba9B633e27116 (sepolia) (Updated 19/7)
- https://sepolia.etherscan.io/address/0xF81D6568B01e6F75EC35dD87558ba9B633e27116#code

### Token addresses:

- Token A: 0xF793f2189Fab2a9580D57592ffF335703dc9Ea59
- Token B: 0x67C180f58081F4a9f588Cf9a930e70f0E036bEC3

## Hardhat Test

### Test Result

- Deployment - PASSED
  ✔ This should set the tokens correctly.
- Add initial liquidity - PASSED
  ✔ This should add initial liquidity correctly.
  ✔ This should add additional liquidity proportionally
- Remove liquidity PASSED
  ✔ Should remove liquidity correctly
- Token swap PASSED
  ✔ Should swap token A for token B
  ✔ Should swap token B for token A
- View functions PASSED
  ✔ Should get the correct price
  ✔ Should calculate output amount correctly

#### Coverage Test

- SimpleSwap.sol
  - Stmts 92.96%
  - Branch 54.76%
  - Funcs 100 %
  - Lines 90 %

## SimpleSwap WebApp

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

## SimpleSwap Contract Interface

### Main Functions

#### Liquidity Management

- **addLiquidity**

  - Adds liquidity to the token pair
  - Parameters: tokenA, tokenB, desired amounts and minimums, recipient, deadline
  - Returns: added amounts and issued liquidity tokens

- **removeLiquidity**
  - Withdraws liquidity from the token pair
  - Parameters: tokenA, tokenB, liquidity to burn, minimum amounts, recipient, deadline
  - Returns: amounts of tokens returned

#### Swap Operations

- **swapExactTokensForTokens**
  - Swaps an exact amount of input tokens for output tokens
  - Parameters: input amount, minimum output amount, token path, recipient, deadline
  - Returns: array with input and output amounts

#### Query Functions

- **getPrice**

  - Gets the price of one token in terms of another
  - Parameters: tokenA, tokenB
  - Returns: price with 18 decimals

- **getAmountOut**

  - Calculates the amount of tokens to receive in a swap
  - Parameters: input amount, input reserve, output reserve
  - Returns: amount of tokens to receive

- **getReserves**
  - Gets the current reserves of the token pair
  - Parameters: tokenA, tokenB
  - Returns: reserves of both tokens

### Events

- **LiquidityAdded**

  - Emitted when liquidity is added
  - Parameters: tokenA, tokenB, amounts added, liquidity issued

- **LiquidityRemoved**

  - Emitted when liquidity is withdrawn
  - Parameters: tokenA, tokenB, amounts withdrawn, liquidity burned

- **Swap**
  - Emitted when a swap is executed
  - Parameters: input token, output token, input amount, output amount
