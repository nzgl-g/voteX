require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
const { PRIVATE_KEY, INFURA_API_KEY, ALCHEMY_API_KEY, ETHERSCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : undefined,
      timeout: 60000 // 1 minute
    },
    sepolia: {
      url: INFURA_API_KEY 
        ? `https://sepolia.infura.io/v3/${INFURA_API_KEY}`
        : ALCHEMY_API_KEY 
          ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}` 
          : "",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
      chainId: 11155111
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};
