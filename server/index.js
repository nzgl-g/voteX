const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb://127.0.0.1:27017/votex");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log(
      "Please make sure MongoDB is installed and running on your system."
    );
    process.exit(1);
  }
};

const app = express();

// Enable CORS for all routes
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Require routes
const routes = require("./startup/routes");
routes(app);

// Start server function
const startServer = async (port) => {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port)
      .once("listening", () => {
        console.log(`Server listening at port ${port}`);
        resolve(server);
      })
      .once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`Port ${port} is in use, trying port ${port + 1}`);
          server.close();
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

// Connect to DB and start server
connectDB().then(() => {
  startServer(2000);
});

// Require jsonwebtoken
const jwt = require("jsonwebtoken");
