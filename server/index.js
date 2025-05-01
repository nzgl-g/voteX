const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io"); // Socket.IO
const blockchainController = require("./utils/blockchainController");

let io;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb://127.0.0.1:27017/votex");
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

const routes = require("./startup/routes");
routes(app);

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

  socket.on("join-session", (sessionId) => {
    if (sessionId) {
      socket.join(sessionId.toString());
      console.log(`User joined session room: ${sessionId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Initialize blockchain controller if environment variables are set
const initializeBlockchain = async () => {
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (privateKey && contractAddress) {
    try {
      console.log("Initializing blockchain controller...");
      await blockchainController.initialize(privateKey, contractAddress);
      console.log("Blockchain controller initialized successfully");
    } catch (error) {
      console.error("Error initializing blockchain controller:", error);
      console.log("Blockchain features will not be available until controller is initialized via API");
    }
  } else {
    console.log("BLOCKCHAIN_PRIVATE_KEY or CONTRACT_ADDRESS not set. Blockchain controller not initialized.");
    console.log("To enable blockchain features, please initialize the controller via API");
  }
};

// Start server function
const startServer = async (port) => {
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

// Connect DB, initialize blockchain and start server
connectDB()
  .then(async () => {
    await initializeBlockchain();
    return startServer(2000);
  })
  .catch((error) => {
    console.error("Error starting application:", error);
    process.exit(1);
  });
