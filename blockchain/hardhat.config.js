require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Load private keys from environment variables
// You'll need to create a .env file with these variables
const PRIVATE_KEY = "0x57d652cb0a4a5233cff5bbe6eb9b351be94c266d85728217b392ad0e1cc0e82f"

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // Local development networks
    hardhat: {
      chainId: 1337
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: [PRIVATE_KEY]
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [PRIVATE_KEY]
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
