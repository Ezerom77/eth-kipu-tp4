const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const SimpleSwapModule = buildModule("SimpleSwapModule", (deployer) => {
  const SimpleSwap = deployer.contract("SimpleSwap", ["0xF793f2189Fab2a9580D57592ffF335703dc9Ea59", "0x67C180f58081F4a9f588Cf9a930e70f0E036bEC3"]);

  return { SimpleSwap };
});

module.exports = SimpleSwapModule;