// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title TestERC20
/// @notice Token ERC20 simple para pruebas
/// @dev Extiende el contrato ERC20 de OpenZeppelin
contract TestERC20 is ERC20 {
    /// @notice Constructor que crea un token ERC20 con suministro inicial
    /// @param name Nombre del token
    /// @param symbol Símbolo del token
    /// @param initialSupply Suministro inicial del token
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
