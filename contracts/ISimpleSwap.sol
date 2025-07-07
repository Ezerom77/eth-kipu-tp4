// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title ISimpleSwap
/// @notice Interface for the token exchange contract
/// @dev Defines the main functions to interact with the SimpleSwap contract
interface ISimpleSwap {
    /// @notice Event emitted when liquidity is added to a token pair
    /// @param tokenA Address of the first token
    /// @param tokenB Address of the second token
    /// @param amountA Amount of the first token added
    /// @param amountB Amount of the second token added
    /// @param liquidity Amount of liquidity tokens issued
    event LiquidityAdded(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    /// @notice Event emitted when liquidity is removed from a token pair
    /// @param tokenA Address of the first token
    /// @param tokenB Address of the second token
    /// @param amountA Amount of the first token withdrawn
    /// @param amountB Amount of the second token withdrawn
    /// @param liquidity Amount of liquidity tokens burned
    event LiquidityRemoved(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    /// @notice Event emitted when a token swap is performed
    /// @param tokenIn Address of the input token
    /// @param tokenOut Address of the output token
    /// @param amountIn Amount of the input token
    /// @param amountOut Amount of the output token
    event Swap(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    /// @notice Adds liquidity to a token pair
    /// @dev Transfers tokens from the user to the contract and issues liquidity tokens
    /// @param tokenA Address of the first token
    /// @param tokenB Address of the second token
    /// @param amountADesired Desired amount of the first token
    /// @param amountBDesired Desired amount of the second token
    /// @param amountAMin Minimum acceptable amount of the first token
    /// @param amountBMin Minimum acceptable amount of the second token
    /// @param to Address of the recipient of the liquidity tokens
    /// @param deadline Timestamp limit for the transaction
    /// @return amountA Effective amount of the first token added
    /// @return amountB Effective amount of the second token added
    /// @return liquidity Amount of liquidity tokens issued
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    /// @notice Removes liquidity from a token pair
    /// @dev Burns liquidity tokens and returns the corresponding tokens
    /// @param tokenA Address of the first token
    /// @param tokenB Address of the second token
    /// @param liquidity Amount of liquidity tokens to burn
    /// @param amountAMin Minimum acceptable amount of the first token
    /// @param amountBMin Minimum acceptable amount of the second token
    /// @param to Address of the recipient of the tokens
    /// @param deadline Timestamp limit for the transaction
    /// @return amountA Amount of the first token returned
    /// @return amountB Amount of the second token returned
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    /// @notice Swaps an exact amount of input tokens for output tokens
    /// @dev Supports swaps through multiple token pairs
    /// @param amountIn Exact amount of input tokens
    /// @param amountOutMin Minimum amount of output tokens to receive
    /// @param path Path of tokens for the swap (input token, output token)
    /// @param to Address of the recipient of the output tokens
    /// @param deadline Timestamp limit for the transaction
    /// @return amounts Array with the input and output amounts
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /// @notice Gets the price of a token in terms of another
    /// @dev The price is expressed with 18 decimals
    /// @param tokenA Address of the first token
    /// @param tokenB Address of the second token
    /// @return price Price of tokenA in terms of tokenB
    function getPrice(
        address tokenA,
        address tokenB
    ) external view returns (uint256 price);

    /// @notice Calculates the amount of tokens to receive in a swap
    /// @dev Uses the formula x*y=k without fees
    /// @param amountIn Amount of input tokens
    /// @param reserveIn Reserve of the input token
    /// @param reserveOut Reserve of the output token
    /// @return amountOut Amount of tokens to receive
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) external pure returns (uint256 amountOut);

    /// @notice Gets the current reserves of a token pair
    /// @param tokenA Address of the first token
    /// @param tokenB Address of the second token
    /// @return reserveA Reserve of the first token
    /// @return reserveB Reserve of the second token
    function getReserves(
        address tokenA,
        address tokenB
    ) external view returns (uint256 reserveA, uint256 reserveB);
}
