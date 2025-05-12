require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Load private keys from environment variables
// You'll need to create a .env file with these variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x1ddae39968c6195f09e695e35792a9f99fdc01e605e5ba0f64d18b2070673535";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

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
    },
    
    // Testnet
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
