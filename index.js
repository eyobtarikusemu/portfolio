const express = require("express");
require("dotenv").config();
const path = require("path");
const startBot = require("./bot/index");
const app = express();
const connectDB = require("./connect");
const cors = require("cors");
const router = require("./routes/projects");

app.use(cors());
app.use(express.json());
app.use("/bot/uploads", express.static(path.join(__dirname, "/bot/uploads")));
app.use("/api", router);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    startBot();
    app.listen(3000, () => console.log("Server started"));
  } catch (error) {
    console.log(error);
  }
};
start();
