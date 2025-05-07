const { ethers } = require('ethers');
const config = require('./config');
const logger = require('../lib/logger');

class ContractService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(config.provider.url);
        this.contract = new ethers.Contract(
            config.contract.address,
            config.contract.abi,
            this.provider
        );
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.contractWithSigner = this.contract.connect(this.wallet);
    }

    async initialize() {
        try {
            const code = await this.provider.getCode(config.contract.address);
            if (code === '0x') {
                throw new Error('Contract not deployed at the specified address');
            }
            return true;
        } catch (error) {
            logger.error('Contract initialization failed:', error);
            throw error;
        }
    }

    async createSession(sessionId, choices, voteMode) {
        try {
            // Check if session already exists
            const isActive = await this.contract.isSessionActive(sessionId);
            if (isActive) {
                throw new Error('Session already exists and is active');
            }

            const tx = await this.contractWithSigner.createSession(
                sessionId,
                choices,
                voteMode,
                { gasLimit: config.gas.limit }
            );
            await tx.wait();
            return tx.hash;
        } catch (error) {
            logger.error('Session creation failed:', error);
            throw error;
        }
    }

    async endSession(sessionId) {
        try {
            const isActive = await this.contract.isSessionActive(sessionId);
            if (!isActive) {
                throw new Error('Session is not active or does not exist');
            }

            const tx = await this.contractWithSigner.endSession(
                sessionId,
                { gasLimit: config.gas.limit }
            );
            await tx.wait();
            return tx.hash;
        } catch (error) {
            logger.error('Session end failed:', error);
            throw error;
        }
    }

    async castVote(sessionId, choiceIds) {
        try {
            const isActive = await this.contract.isSessionActive(sessionId);
            if (!isActive) {
                throw new Error('Session is not active');
            }

            const hasVoted = await this.contract.hasVoted(sessionId, this.wallet.address);
            if (hasVoted) {
                throw new Error('Already voted in this session');
            }

            const tx = await this.contractWithSigner.castVote(
                sessionId,
                choiceIds,
                { gasLimit: config.gas.limit }
            );
            await tx.wait();
            return tx.hash;
        } catch (error) {
            logger.error('Vote casting failed:', error);
            throw error;
        }
    }

    async castRankedVote(sessionId, rankedChoices) {
        try {
            const isActive = await this.contract.isSessionActive(sessionId);
            if (!isActive) {
                throw new Error('Session is not active');
            }

            const hasVoted = await this.contract.hasVoted(sessionId, this.wallet.address);
            if (hasVoted) {
                throw new Error('Already voted in this session');
            }

            const tx = await this.contractWithSigner.castRankedVote(
                sessionId,
                rankedChoices,
                { gasLimit: config.gas.limit }
            );
            await tx.wait();
            return tx.hash;
        } catch (error) {
            logger.error('Ranked vote casting failed:', error);
            throw error;
        }
    }

    async getSessionStatus(sessionId) {
        try {
            const isActive = await this.contract.isSessionActive(sessionId);
            const choices = await this.contract.getSessionChoices(sessionId);
            const voteMode = await this.contract.getSessionVoteMode(sessionId);
            
            const results = {};
            for (const choice of choices) {
                const result = await this.contract.getChoiceResult(sessionId, choice);
                // Convert BigInt to string for JSON serialization
                results[choice] = result.toString();
            }

            return {
                sessionId,
                isActive,
                voteMode: Number(voteMode), // Convert BigInt to number
                choices,
                results
            };
        } catch (error) {
            logger.error('Session status retrieval failed:', error);
            throw error;
        }
    }
}

module.exports = new ContractService(); 