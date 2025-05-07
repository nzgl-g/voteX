const express = require("express");
const mongoose = require("mongoose");
const Session = require("./models/Sessions");
require("dotenv").config();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { startAgenda } = require("./lib/agenda");
const logger = require("./lib/logger");
let io;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.log("Please make sure MongoDB is installed and running.");
        process.exit(1);
    }
};

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use(express.json());

// Import routes
const routes = require("./startup/routes");
const bridgeRoutes = require("./bridge/routes");

// Use routes
routes(app);
app.use("/votex/api/bridge", bridgeRoutes);

io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
app.set("io", io);

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("authenticate", (userId) => {
        if (userId) {
            socket.join(userId.toString());
            console.log(`User ${userId} joined their room`);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Start server function
const startServer = async () => {
    const port = process.env.PORT || 2000;
    return new Promise((resolve, reject) => {
        server
            .listen(port)
            .once("listening", () => {
                console.log(`Server listening at port ${port}`);
                resolve(server);
            })
            .once("error", (err) => {
                if (err.code === "EADDRINUSE") {
                    console.log(`Port ${port} is in use, trying port ${port + 1}`);
                    startServer(port + 1)
                        .then(resolve)
                        .catch(reject);
                } else {
                    console.error("Error starting server:", err);
                    reject(err);
                }
            });
    });
};

// Initialize blockchain bridge
const initBlockchainBridge = async () => {
    try {
        const contractService = require("./bridge/contractService");
        
        // Check if required environment variables are set
        const requiredEnvVars = [
            'BLOCKCHAIN_NETWORK',
            'BLOCKCHAIN_RPC_URL',
            'CONTRACT_ADDRESS',
            'PRIVATE_KEY'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Initialize contract connection
        const isInitialized = await contractService.initialize();
        if (!isInitialized) {
            throw new Error('Failed to initialize contract connection');
        }

        logger.info('Blockchain bridge initialized successfully');
        return true;
    } catch (error) {
        logger.error('Failed to initialize blockchain bridge:', error);
        throw error;
    }
};

// Start the application
const startApp = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Initialize blockchain bridge
        await initBlockchainBridge();
        
        // Start Agenda
        await startAgenda();
        
        // Start server
        await startServer();
        
        logger.info('Application started successfully');
    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
};

// Start the application
startApp();
