/**
 * Metadata Service
 * Handles the storage and retrieval of session metadata off-chain
 */

const config = require("./config");
const mongoose = require("mongoose");

// Define a schema for session metadata if using MongoDB
const SessionMetadataSchema = new mongoose.Schema({
  // On-chain data
  sessionAddress: { type: String, required: true, unique: true, index: true },
  teamLeaderAddress: { type: String, required: true, index: true },
  
  // Basic metadata
  sessionName: { type: String, required: true },
  sessionType: { type: Number, required: true }, // 0: Poll, 1: Election
  votingMode: { type: Number, required: true }, // 0: Single, 1: Multiple, 2: Ranked
  
  // Configuration
  maxChoices: { type: Number, default: 0 },
  minRankedChoices: { type: Number, default: 0 },
  maxRankedChoices: { type: Number, default: 0 },
  
  // Options
  options: [{ type: String, required: true }],
  
  // Extended metadata (not stored on-chain)
  description: { type: String, default: "" },
  category: { type: String, default: "general" },
  tags: [{ type: String }],
  
  // Timing
  startTime: { type: Date },
  endTime: { type: Date },
  
  // State tracking
  state: { type: Number, default: 0 }, // 0: Created, 1: Started, 2: Ended
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create the model using the schema
const SessionMetadata = mongoose.model("SessionMetadata", SessionMetadataSchema);

/**
 * Service for managing voting session metadata
 */
class MetadataService {
  /**
   * Store session metadata
   * @param {Object} metadata The session metadata
   * @returns {Promise<Object>} The stored metadata
   */
  async storeMetadata(metadata) {
    // Ensure required fields are present
    if (!metadata.sessionAddress || !metadata.teamLeaderAddress || !metadata.sessionName) {
      throw new Error("Missing required metadata fields");
    }
    
    try {
      // Create new metadata document or update existing
      const sessionMetadata = await SessionMetadata.findOneAndUpdate(
        { sessionAddress: metadata.sessionAddress },
        { ...metadata, updatedAt: Date.now() },
        { upsert: true, new: true }
      );
      
      return sessionMetadata.toObject();
    } catch (error) {
      console.error("Failed to store session metadata:", error);
      throw error;
    }
  }
  
  /**
   * Retrieve session metadata
   * @param {string} sessionAddress The session address
   * @returns {Promise<Object>} The session metadata
   */
  async getMetadata(sessionAddress) {
    try {
      const sessionMetadata = await SessionMetadata.findOne({ sessionAddress });
      
      if (!sessionMetadata) {
        throw new Error(`No metadata found for session: ${sessionAddress}`);
      }
      
      return sessionMetadata.toObject();
    } catch (error) {
      console.error(`Failed to get metadata for session ${sessionAddress}:`, error);
      throw error;
    }
  }
  
  /**
   * Update session metadata
   * @param {string} sessionAddress The session address
   * @param {Object} updates The metadata updates
   * @returns {Promise<Object>} The updated metadata
   */
  async updateMetadata(sessionAddress, updates) {
    try {
      // Prevent updating critical fields
      delete updates.sessionAddress;
      delete updates.teamLeaderAddress;
      
      const sessionMetadata = await SessionMetadata.findOneAndUpdate(
        { sessionAddress },
        { ...updates, updatedAt: Date.now() },
        { new: true }
      );
      
      if (!sessionMetadata) {
        throw new Error(`No metadata found for session: ${sessionAddress}`);
      }
      
      return sessionMetadata.toObject();
    } catch (error) {
      console.error(`Failed to update metadata for session ${sessionAddress}:`, error);
      throw error;
    }
  }
  
  /**
   * Update session state
   * @param {string} sessionAddress The session address
   * @param {number} state The new state (0: Created, 1: Started, 2: Ended)
   * @returns {Promise<Object>} The updated metadata
   */
  async updateSessionState(sessionAddress, state) {
    try {
      const sessionMetadata = await SessionMetadata.findOneAndUpdate(
        { sessionAddress },
        { 
          state,
          ...(state === 1 ? { startTime: Date.now() } : {}),
          ...(state === 2 ? { endTime: Date.now() } : {}),
          updatedAt: Date.now() 
        },
        { new: true }
      );
      
      if (!sessionMetadata) {
        throw new Error(`No metadata found for session: ${sessionAddress}`);
      }
      
      return sessionMetadata.toObject();
    } catch (error) {
      console.error(`Failed to update state for session ${sessionAddress}:`, error);
      throw error;
    }
  }
  
  /**
   * Find sessions by criteria
   * @param {Object} criteria The search criteria
   * @returns {Promise<Array>} Array of session metadata
   */
  async findSessions(criteria = {}) {
    try {
      const sessions = await SessionMetadata.find(criteria)
        .sort({ createdAt: -1 });
      
      return sessions.map(session => session.toObject());
    } catch (error) {
      console.error("Failed to find sessions:", error);
      throw error;
    }
  }
  
  /**
   * Find sessions by team leader
   * @param {string} teamLeaderAddress The team leader address
   * @returns {Promise<Array>} Array of session metadata
   */
  async findSessionsByTeamLeader(teamLeaderAddress) {
    return this.findSessions({ teamLeaderAddress });
  }
}

// Create singleton instance
const metadataService = new MetadataService();

module.exports = metadataService; 