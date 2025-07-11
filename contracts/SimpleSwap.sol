// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ISimpleSwap.sol";

/// @title SimpleSwap TP3  Updated on 7/7/2025
/// @author Ezerom77
/// @notice Contract for exchanging a single ERC20 token pair
/// @dev Implements functionalities to add/remove liquidity and swap tokens
contract SimpleSwap is ERC20, ISimpleSwap {
    /// @notice Addresses of the two tokens in the pair
    /// @dev These addresses are immutable and set during contract deployment
    address public immutable tokenA;
    address public immutable tokenB;

    /// @notice Reserves of each token
    /// @dev Private variables to track the amount of each token held by the contract
    uint256 private reserveA;
    uint256 private reserveB;

    /// @notice Modifier to verify that the transaction is executed before the deadline
    /// @param deadline Timestamp limit for the transaction
    /// @dev Reverts if the current block timestamp exceeds the deadline
    modifier ensureDeadline(uint256 deadline) {
        require(deadline >= block.timestamp, "EXPIRED");
        _;
    }

    /// @notice Event emitted when a new token pair is created
    /// @param tokenA Address of the first token in the pair
    /// @param tokenB Address of the second token in the pair
    /// @param pair Address of the created exchange contract
    event PairCreated(
        address indexed tokenA,
        address indexed tokenB,
        address pair
    );

    /// @notice Contract constructor
    /// @dev Initializes the ERC20 token for liquidity tokens and sets the token pair
    /// @param _tokenA Address of the first token in the pair
    /// @param _tokenB Address of the second token in the pair
    constructor(address _tokenA, address _tokenB) ERC20("Liquidity", "SWL") {
        require(_tokenA != address(0) && _tokenB != address(0), "ZERO_ADDRESS");
        require(_tokenA != _tokenB, "IDENTICAL_ADDR");

        // Ensure consistent token ordering
        if (_tokenA < _tokenB) {
            tokenA = _tokenA;
            tokenB = _tokenB;
        } else {
            tokenA = _tokenB;
            tokenB = _tokenA;
        }

        // Emit pair creation event
        emit PairCreated(tokenA, tokenB, address(this));
    }

    /// @inheritdoc ISimpleSwap
    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        override
        ensureDeadline(deadline)
        returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        // Verify tokens match the pair
        require(
            (_tokenA == tokenA && _tokenB == tokenB) ||
                (_tokenA == tokenB && _tokenB == tokenA),
            "INVALID_PAIR"
        );

        // Normalize token order and amounts
        if (_tokenA != tokenA) {
            // Swap values if tokens are provided in reverse order
            (amountADesired, amountBDesired) = (amountBDesired, amountADesired);
            (amountAMin, amountBMin) = (amountBMin, amountAMin);
        }

        // Almacenar reservas en memoria
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;

        // Calcular optimal amounts
        if (_reserveA == 0 && _reserveB == 0) {
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            uint256 amountBOptimal = quote(amountADesired, _reserveA, _reserveB);

            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "INSUFFICIENT_B");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = quote(
                    amountBDesired,
                    _reserveB,
                    _reserveA
                );
                require(amountAOptimal <= amountADesired, "EXCESSIVE_INPUT");
                require(amountAOptimal >= amountAMin, "INSUFFICIENT_A");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
        }

        // Transfer tokens to contract
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        // Update reserves
        reserveA += amountA;
        reserveB += amountB;

        // Calculate liquidity to mint
        uint256 totalSupply = totalSupply();
        if (totalSupply == 0) {
            // First time adding liquidity
            liquidity = sqrt(amountA * amountB);
        } else {
            // Calculate proportional liquidity
            liquidity = min(
                (amountA * totalSupply) / reserveA,
                (amountB * totalSupply) / reserveB
            );
        }

        require(liquidity > 0, "NO_LIQUIDITY");

        // Mint liquidity tokens
        _mint(to, liquidity);

        emit LiquidityAdded(tokenA, tokenB, amountA, amountB, liquidity);

        return (amountA, amountB, liquidity);
    }

    /// @inheritdoc ISimpleSwap
    function removeLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        override
        ensureDeadline(deadline)
        returns (uint256 amountA, uint256 amountB)
    {
        // Verify tokens match the pair
        require(
            (_tokenA == tokenA && _tokenB == tokenB) ||
                (_tokenA == tokenB && _tokenB == tokenA),
            "INVALID_PAIR"
        );

        // Normalize token order and minimum amounts
        if (_tokenA != tokenA) {
            // Swap values if tokens are provided in reverse order
            (amountAMin, amountBMin) = (amountBMin, amountAMin);
        }

        // Almacenar valores en memoria
        uint256 _totalSupply = totalSupply();
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;

        // Calcular montos usando variables en memoria
        amountA = (liquidity * _reserveA) / _totalSupply;
        amountB = (liquidity * _reserveB) / _totalSupply;

        require(amountA >= amountAMin, "INSUFFICIENT_A");
        require(amountB >= amountBMin, "INSUFFICIENT_B");

        // Burn liquidity tokens first (effects before interactions)
        _burn(msg.sender, liquidity);

        // Update reserves
        reserveA -= amountA;
        reserveB -= amountB;

        // Transfer tokens to user
        IERC20(tokenA).transfer(to, amountA);
        IERC20(tokenB).transfer(to, amountB);

        emit LiquidityRemoved(tokenA, tokenB, amountA, amountB, liquidity);

        return (amountA, amountB);
    }

    /// @inheritdoc ISimpleSwap
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
        override
        ensureDeadline(deadline)
        returns (uint256[] memory amounts)
    {
        require(path.length == 2, "INVALID_PATH_LENGTH");
        require(
            (path[0] == tokenA && path[1] == tokenB) ||
                (path[0] == tokenB && path[1] == tokenA),
            "INVALID_PATH"
        );

        bool isTokenAToB = path[0] == tokenA;
        uint256 _reserveIn;
        uint256 _reserveOut;

        if (isTokenAToB) {
            _reserveIn = reserveA;
            _reserveOut = reserveB;
        } else {
            _reserveIn = reserveB;
            _reserveOut = reserveA;
        }

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = getAmountOut(amountIn, _reserveIn, _reserveOut);

        require(amounts[1] >= amountOutMin, "INSUFFICIENT_OUT");

        // Transfer input token to contract
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        // Update reserves
        if (isTokenAToB) {
            reserveA += amountIn;
            reserveB -= amounts[1];
        } else {
            reserveB += amountIn;
            reserveA -= amounts[1];
        }

        // Transfer output token to recipient
        IERC20(path[1]).transfer(to, amounts[1]);

        emit Swap(path[0], path[1], amountIn, amounts[1]);

        return amounts;
    }

    /// @inheritdoc ISimpleSwap
    function getPrice(
        address _tokenA,
        address _tokenB
    ) external view override returns (uint256 price) {
        // Verify tokens match the pair
        require(
            (_tokenA == tokenA && _tokenB == tokenB) ||
                (_tokenA == tokenB && _tokenB == tokenA),
            "INVALID_PAIR"
        );

        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        require(_reserveA > 0 && _reserveB > 0, "NO_LIQUIDITY");

        if (_tokenA == tokenA) {
            return (_reserveB * 1e18) / _reserveA;
        } else {
            return (_reserveA * 1e18) / _reserveB;
        }
    }

    /// @inheritdoc ISimpleSwap
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure override returns (uint256 amountOut) {
        require(amountIn > 0, "INSUFFICIENT_IN");
        require(reserveIn > 0 && reserveOut > 0, "NO_LIQUIDITY");

        // Uniswap formula without fees: x * y = k
        // (reserveIn + amountIn) * (reserveOut - amountOut) = reserveIn * reserveOut
        // Solving for amountOut:
        // amountOut = reserveOut - (reserveIn * reserveOut) / (reserveIn + amountIn)

        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        amountOut = numerator / denominator;

        return amountOut;
    }

    /// @inheritdoc ISimpleSwap
    function getReserves(
        address _tokenA,
        address _tokenB
    ) external view override returns (uint256 _reserveA, uint256 _reserveB) {
        // Verify tokens match the pair
        require(
            (_tokenA == tokenA && _tokenB == tokenB) ||
                (_tokenA == tokenB && _tokenB == tokenA),
            "INVALID_PAIR"
        );

        if (_tokenA == tokenA) {
            return (reserveA, reserveB);
        } else {
            return (reserveB, reserveA);
        }
    }

    /// @notice Calculates the proportion between tokens based on reserves
    /// @dev Helper function to calculate optimal amounts
    /// @param amountA Amount of token A
    /// @param _reserveA Reserve of token A
    /// @param _reserveB Reserve of token B
    /// @return amountB Equivalent amount of token B
    function quote(
        uint256 amountA,
        uint256 _reserveA,
        uint256 _reserveB
    ) internal pure returns (uint256 amountB) {
        require(amountA > 0, "INSUFFICIENT_AMT");
        require(_reserveA > 0 && _reserveB > 0, "NO_LIQUIDITY");
        amountB = (amountA * _reserveB) / _reserveA;
        return amountB;
    }

    /// @notice Returns the minimum value between two numbers
    /// @dev Internal helper function used in liquidity calculations
    /// @param x First number
    /// @param y Second number
    /// @return z The minimum value between x and y
    function min(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x < y ? x : y;
    }

    /// @notice Calculates the square root of a number
    /// @dev Internal helper function used in liquidity calculations
    /// @param y Number for which the square root will be calculated
    /// @return z The square root of y
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
