const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const SimpleSwapModule = buildModule("SimpleSwapModule", (deployer) => {
  const SimpleSwap = deployer.contract("SimpleSwap", ["0x73511669fd4dE447feD18BB79bAFeAC93aB7F31f", "0xB581C9264f59BF0289fA76D61B2D0746dCE3C30D"]);

  return { SimpleSwap };
});

module.exports = SimpleSwapModule;