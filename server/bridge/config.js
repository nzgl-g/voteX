const config = {
    // Network configuration
    network: process.env.BLOCKCHAIN_NETWORK || 'localhost',
    
    // Contract configuration
    contract: {
        address: process.env.CONTRACT_ADDRESS,
        abi: require('../../blockchain/artifacts/contracts/VotingSystem.sol/VotingSystem.json').abi
    },
    
    // Provider configuration
    provider: {
        url: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545'
    },
    
    // Gas configuration
    gas: {
        limit: 5000000,
        price: process.env.GAS_PRICE || '20000000000' // 20 gwei
    }
};

module.exports = config; 