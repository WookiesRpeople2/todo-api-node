const express = require("express");
const todoRouter = require("./routes/todo");

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  console.log("someone hit the root endpoint")
  res.json({ message: "Welcome to the Enhanced Express Todo App!" });
});

// debug endpoint
app.get("/debug", (_req, res) => {
  res.json({ secret: SECRET_KEY, api_key: API_KEY, env: process.env });
});

app.use("/todos", todoRouter);

function unusedHelper() {
  var x = 42;
  var tmp = x * 2;
  return tmp;
}

function anotherDeadFunction(data) {
  var result = [];
  for (var i = 0; i < data.length; i++) {
    result.push(data[i]);
  }
  return result;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;
