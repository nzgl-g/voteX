/**
 * Blockchain Routes Test
 * 
 * This script tests the blockchain routes using the mock blockchain service.
 * Note: Before running this test, ensure MongoDB is running and the server is configured correctly.
 */

const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const blockchainRoutes = require('../routes/blockchain');
const mockBlockchainController = require('../utils/mockBlockchainController');
const Session = require('../models/Sessions');

// Set up test environment
const app = express();
app.use(bodyParser.json());
app.use('/api/blockchain', blockchainRoutes);

// Add the expect assertion library
const { expect } = require('chai');

// Connect to the test database
before(async function() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vote-system-test');
  console.log('Connected to test database');
});

// Cleanup after tests
after(async function() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  console.log('Test database dropped and connection closed');
});

describe('Blockchain Routes', function() {
  let testSessionId;
  let testSession;
  
  before(async function() {
    // Create a test session
    testSession = new Session({
      name: 'Test Blockchain Session',
      description: 'A test session for blockchain integration',
      type: 'poll',
      subtype: 'single',
      options: [
        { name: 'Option 1', description: 'First option' },
        { name: 'Option 2', description: 'Second option' },
        { name: 'Option 3', description: 'Third option' }
      ],
      sessionLifecycle: {
        createdAt: new Date(),
        scheduledAt: {
          start: new Date(Date.now() + 60000), // 1 minute from now
          end: new Date(Date.now() + 300000)   // 5 minutes from now
        }
      }
    });
    
    await testSession.save();
    testSessionId = testSession._id.toString();
    console.log(`Created test session with ID: ${testSessionId}`);
  });
  
  describe('Controller Initialization', function() {
    it('should initialize the blockchain controller', async function() {
      const res = await request(app)
        .post('/api/blockchain/initialize')
        .send({
          privateKey: 'mock_private_key',
          contractAddress: 'mock_contract_address'
        });
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(mockBlockchainController.initialized).to.equal(true);
    });
    
    it('should reject initialization without a private key', async function() {
      const res = await request(app)
        .post('/api/blockchain/initialize')
        .send({
          contractAddress: 'mock_contract_address'
        });
      
      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.equal(false);
    });
  });
  
  describe('Session Management', function() {
    it('should start a session on the blockchain', async function() {
      const res = await request(app)
        .post(`/api/blockchain/sessions/${testSessionId}/start`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.have.property('transactionHash');
      expect(res.body.data).to.have.property('blockNumber');
    });
    
    it('should check if a session is active', async function() {
      const res = await request(app)
        .get(`/api/blockchain/sessions/${testSessionId}/status`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.active).to.equal(true);
    });
    
    it('should record a mock vote', async function() {
      const optionId = testSession.options[0]._id.toString();
      const res = await request(app)
        .post(`/api/blockchain/mock/sessions/${testSessionId}/vote`)
        .send({
          voterAddress: '0xMockVoterAddress1',
          choiceIds: [optionId]
        });
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.have.property('transactionHash');
    });
    
    it('should get session results', async function() {
      const res = await request(app)
        .get(`/api/blockchain/sessions/${testSessionId}/results`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.be.an('object');
      
      const optionId = testSession.options[0]._id.toString();
      expect(res.body.data[optionId]).to.equal(1);
    });
    
    it('should end a session on the blockchain', async function() {
      const res = await request(app)
        .post(`/api/blockchain/sessions/${testSessionId}/end`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.have.property('transactionHash');
      expect(res.body.data).to.have.property('blockNumber');
    });
  });
  
  describe('Session Scheduling', function() {
    it('should schedule a session to start', async function() {
      const startDate = new Date(Date.now() + 3600000); // 1 hour from now
      
      const res = await request(app)
        .post(`/api/blockchain/sessions/${testSessionId}/schedule/start`)
        .send({ startDate: startDate.toISOString() });
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.equal(true);
    });
    
    it('should schedule a session to end', async function() {
      const endDate = new Date(Date.now() + 7200000); // 2 hours from now
      
      const res = await request(app)
        .post(`/api/blockchain/sessions/${testSessionId}/schedule/end`)
        .send({ endDate: endDate.toISOString() });
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.equal(true);
    });
  });
}); 