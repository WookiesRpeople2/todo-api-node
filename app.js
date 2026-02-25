const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const todoRouter = require("./routes/todo");

const app = express();
const productionLazyImport = (callback) => {
  if (process.env.NODE_ENV !== "production") {
    (async () => {
      callback();
    })();
  }
};
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the Enhanced Express Todo App!" });
});

productionLazyImport(() => {
  app.get("/debug", (_req, res) => {
    res.json({
      secret: process.env.SECRET_KEY,
      api_key: process.env.API_KEY,
    });
  });
});

app.get("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/todos", todoRouter);

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
