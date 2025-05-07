/**
 * Blockchain Connector
 * 
 * Utility to connect to the blockchain and interact with the VotingSystem contract.
 * This module handles the connection to the blockchain and provides methods to
 * interact with the contract.
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
const mockContractAdapter = require('./mockContractAdapter');

class BlockchainConnector {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isInitialized = false;
    this.contractAddress = null;
    this.useMock = process.env.USE_MOCK_BLOCKCHAIN === 'true';
  }

  /**
   * Initialize the blockchain connector
   * @param {Object} options - Initialization options
   * @param {string} options.privateKey - Private key for signing transactions
   * @param {string} options.contractAddress - Address of the deployed contract
   * @param {string} options.providerUrl - URL of the Ethereum provider (default: http://127.0.0.1:8545)
   * @param {boolean} options.useMock - Whether to use the mock contract adapter (default: false)
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize(options = {}) {
    try {
      const {
        privateKey,
        contractAddress,
        providerUrl = 'http://127.0.0.1:8545',
        useMock = this.useMock
      } = options;

      this.useMock = useMock;
      
      // If using mock, set up mock contract
      if (this.useMock) {
        console.log('Using mock blockchain contract adapter');
        this.contract = mockContractAdapter;
        this.isInitialized = true;
        return true;
      }

      // Validate required parameters
      if (!privateKey) {
        throw new Error('Private key is required');
      }

      // Set up provider
      this.provider = new ethers.JsonRpcProvider(providerUrl);
      
      // Set up signer
      this.signer = new ethers.Wallet(privateKey, this.provider);
      
      // Get contract address
      this.contractAddress = contractAddress || this._getContractAddress();
      if (!this.contractAddress) {
        throw new Error('Contract address not found');
      }
      
      // Get contract ABI
      const contractInfo = this._getContractInfo();
      if (!contractInfo || !contractInfo.abi) {
        throw new Error('Contract ABI not found');
      }
      
      // Create contract instance
      this.contract = new ethers.Contract(
        this.contractAddress,
        contractInfo.abi,
        this.signer
      );
      
      // Test connection
      await this.provider.getBlockNumber();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain connector:', error);
      
      // Fall back to mock if real blockchain initialization fails
      if (!this.useMock) {
        console.log('Falling back to mock blockchain contract adapter');
        this.contract = mockContractAdapter;
        this.isInitialized = true;
        this.useMock = true;
        return true;
      }
      
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Check if the connector is initialized
   * @returns {boolean} - True if initialized
   */
  checkInitialized() {
    if (!this.isInitialized) {
      throw new Error('Blockchain connector not initialized');
    }
    return true;
  }

  /**
   * Get the contract address from the contract-address.json file
   * @returns {string|null} - Contract address or null if not found
   * @private
   */
  _getContractAddress() {
    try {
      const contractAddressPath = path.join(
        __dirname,
        '../../contracts_info/contract-address.json'
      );
      
      if (!fs.existsSync(contractAddressPath)) {
        return null;
      }
      
      const contractAddressFile = fs.readFileSync(contractAddressPath, 'utf8');
      const contractAddress = JSON.parse(contractAddressFile).VotingSystem;
      
      return contractAddress;
    } catch (error) {
      console.error('Failed to get contract address:', error);
      return null;
    }
  }

  /**
   * Get the contract information from the VotingSystem.json file
   * @returns {Object|null} - Contract information or null if not found
   * @private
   */
  _getContractInfo() {
    try {
      const contractInfoPath = path.join(
        __dirname,
        '../../contracts_info/VotingSystem.json'
      );
      
      if (!fs.existsSync(contractInfoPath)) {
        return null;
      }
      
      const contractInfoFile = fs.readFileSync(contractInfoPath, 'utf8');
      return JSON.parse(contractInfoFile);
    } catch (error) {
      console.error('Failed to get contract info:', error);
      return null;
    }
  }

  /**
   * Get the status of the blockchain connection
   * @returns {Object} - Status information
   */
  async getStatus() {
    try {
      if (!this.isInitialized) {
        return {
          initialized: false,
          connected: false,
          contractAddress: null,
          signerAddress: null,
          network: null
        };
      }

      if (this.useMock) {
        return {
          initialized: true,
          connected: true,
          contractAddress: 'MOCK_CONTRACT',
          signerAddress: 'MOCK_SIGNER',
          network: {
            name: 'mock',
            chainId: 0,
            blockNumber: 0
          },
          isMock: true
        };
      }

      const network = await this.provider.getNetwork();
      const signerAddress = await this.signer.getAddress();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        initialized: true,
        connected: true,
        contractAddress: this.contractAddress,
        signerAddress,
        network: {
          name: network.name,
          chainId: network.chainId,
          blockNumber
        }
      };
    } catch (error) {
      console.error('Failed to get blockchain status:', error);
      return {
        initialized: this.isInitialized,
        connected: false,
        error: error.message
      };
    }
  }
}

// Create and export a singleton instance
const blockchainConnector = new BlockchainConnector();
module.exports = blockchainConnector; 