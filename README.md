# eth-kipu-tp4

## Updated on 19/7/2025

This repository contains TP4, following the course guidelines, and includes corrections to the original code to correct the problem of multiple accesses to state variables.

# SimpleSwap - ERC20 Token Exchange

## Description

SimpleSwap is a smart contract that implements a decentralized exchange for a pair of ERC20 tokens. It allows users to add/remove liquidity and perform swaps between the two tokens in the pair. The contract is inspired by the Uniswap V2 model, using the constant product mechanism (x\*y=k) to determine exchange prices.

## Main Features

- Token exchange: Allows swapping one token for another using the constant product model
- Liquidity management: Users can add and remove liquidity from the token pair
- Liquidity tokens: Liquidity providers receive ERC20 tokens that represent their share in the pool
- Slippage protection: Allows specifying minimum amounts to protect against unfavorable price changes
- Time limit: All operations have a deadline parameter to protect against long-pending transactions

## Contracts

### SimpleSwap.sol

Main implementation of the exchange that inherits from ERC20 (OpenZeppelin) for liquidity token management and implements the ISimpleSwap interface.

- Tokens: Stores the addresses of the two tokens in the pair as immutable variables
- Reserves: Keeps track of the reserves for each token
- Events: Emits events for all important operations (adding/removing liquidity, swaps)
- Optimization: Implements optimizations to reduce gas consumption by using memory variables

### ISimpleSwap.sol

Interface that defines the functions and events that the SimpleSwap contract must implement.

## Main Functions

### Liquidity Management

- addLiquidity

  - Adds liquidity to the token pair
  - Parameters: tokenA, tokenB, desired and minimum amounts, recipient, deadline
  - Returns: amounts added and liquidity tokens issued

- removeLiquidity

  - Removes liquidity from the token pair
  - Parameters: tokenA, tokenB, liquidity to burn, minimum amounts, recipient, deadline
  - Returns: amounts of tokens returned

### Swap Operations

- swapExactTokensForTokens
  - Swaps an exact amount of input tokens for output tokens
  - Parameters: input amount, minimum output amount, token path, recipient, deadline
  - Returns: array with input and output amounts

### Query Functions

- getPrice

  - Gets the price of one token in terms of another
  - Parameters: tokenA, tokenB
  - Returns: price with 18 decimals

- getAmountOut

  - Calculates the amount of tokens to receive in a swap
  - Parameters: input amount, input reserve, output reserve
  - Returns: amount of tokens to receive

- getReserves

  - Gets the current reserves of the token pair
  - Parameters: tokenA, tokenB
  - Returns: reserves of both tokens

## Events

- LiquidityAdded: Emitted when liquidity is added
- LiquidityRemoved: Emitted when liquidity is removed
- Swap: Emitted when a swap is executed
- Sync: Emitted when reserves are synchronized
- Mint: Emitted when liquidity tokens are minted
- Burn: Emitted when liquidity tokens are burned
- TokenATransfer and TokenBTransfer: Emitted when tokens are transferred

## Deployment

### Deployed Contracts

- SimpleSwap: 0xF81D6568B01e6F75EC35dD87558ba9B633e27116 (Sepolia)
- Token A: 0xF793f2189Fab2a9580D57592ffF335703dc9Ea59
- Token B: 0x67C180f58081F4a9f588Cf9a930e70f0E036bEC3

### Verification

- Contract verified on Etherscan
  https://sepolia.etherscan.io/address/0xF81D6568B01e6F75EC35dD87558ba9B633e27116#code

## Web Interface

- URL: https://eth-kipu-tp4.vercel.app/
- Repository: https://github.com/Ezerom77/eth-kipu-tp4

### Web Application Features

- Wallet connection (MetaMask)
- Token balance display
- Real-time exchange price calculation
- Estimation of tokens to receive
- Liquidity pool reserves display
- Bidirectional exchange (A→B or B→A)
- Slippage protection
- Error handling and user feedback

## Requirements

- MetaMask installed in the browser
- ERC20 tokens in the wallet to perform exchanges
- Connection to the Ethereum network (Sepolia testnet)

## Tests

The contract has been thoroughly tested with Hardhat:

- Deployment: ✅ PASSED
- Initial liquidity addition: ✅ PASSED
- Additional liquidity addition: ✅ PASSED
- Liquidity removal: ✅ PASSED
- Token exchange: ✅ PASSED
- Query functions: ✅ PASSED

### Test Coverage

- Statements: 94.57%
- Branch: 54.76%
- Functions: 100%
- Lines: 91.97%

## Technical Notes

- The contract uses the OpenZeppelin library for ERC20 standard implementation
- Optimizations are implemented to reduce gas consumption by using memory variables
- The contract does not include exchange fees
- The constant product formula is implemented without fees: (reserveIn + amountIn) _ (reserveOut - amountOut) = reserveIn _ reserveOut

## Updates

- Last update: 19/7/2025
- Contract updated: 19/7/2025

## Author

- Ezerom77
