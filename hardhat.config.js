require("@nomicfoundation/hardhat-toolbox");
const { vars } = require("hardhat/config");
require("dotenv").config();

const INFURA_NODO = process.env.NODO; // write in the blockchain
const SEPOLIA_PRIVATE_KEY = process.env.PRKEY // pay the gas
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_KEY; // verify the contract

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true  // Añadir esta línea para habilitar viaIR
    }
  },
  networks: {
    sepolia: {
      url: INFURA_NODO,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
};