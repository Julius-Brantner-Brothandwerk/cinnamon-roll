require("dotenv").config();
const express = require("express");
const newOrder = require("./newOrder");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/new-order", newOrder);

app.listen(8080, () => {
  console.log("server started");
});

module.exports = app;
