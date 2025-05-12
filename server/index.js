const express = require("express");
const mongoose = require("mongoose");
const Session = require("./models/Sessions");
require("dotenv").config();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
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

// Enable CORS with more permissive settings for development
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

// Use routes
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

// Start the application
const startApp = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    await startServer();
  } catch (error) {
    process.exit(1);
  }
};

// Start the application
startApp();
