const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
mongoose.connect("mongodb://localhost:27017/votex").then(() => {
  console.log("the database has been connected");
});
const app = express();
app.use(express.json());
app.use(cors());

require("./startup/routes")(app);
app.listen("2000", () => {
  console.log("listening at port 2000");
});
