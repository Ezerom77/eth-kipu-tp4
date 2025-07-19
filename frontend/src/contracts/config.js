export const SIMPLE_SWAP_ADDRESS = "0xF81D6568B01e6F75EC35dD87558ba9B633e27116";
export const TOKEN_A_ADDRESS = "0xF793f2189Fab2a9580D57592ffF335703dc9Ea59";
export const TOKEN_B_ADDRESS = "0x67C180f58081F4a9f588Cf9a930e70f0E036bEC3";

export const SIMPLE_SWAP_ABI = [
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)",
  "function getPrice(address tokenA, address tokenB) external view returns (uint256 price)",
  "function getReserves(address tokenA, address tokenB) external view returns (uint256 reserveA, uint256 reserveB)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256 amountOut)",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string memory)",
  "function name() external view returns (string memory)"
];