const express = require("express");
require("dotenv").config();
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/twitter", (req, res) => {
    res.send("Hello World! from twitter and facebook")
})

app.get("/youtube", (req, res)=>{
    res.send("<h4>YouTube</h4>")
})

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${port}`);
});
