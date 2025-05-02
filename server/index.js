const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io"); // Socket.IO

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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

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

// Connect DB and start
connectDB().then(() => {
  startServer(2000);
});