/**
 * Main Express application for Todo API
 * Provides RESTful endpoints for managing todos with SQLite backend
 */
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const todoRouter = require("./routes/todo");
const flagsmith = require("flagsmith-nodejs");
const app = express();

/**
 * Helper function to conditionally load routes only in non-production environments
 * Used to gate debug endpoints that should not be exposed in production
 * @param {Function} callback - Function to execute if not in production
 */
const productionLazyImport = (callback) => {
  if (process.env.NODE_ENV !== "production") {
    (async () => {
      callback();
    })();
  }
};

flagsmith.init({
  environmentID: process.env.FLAGSMITH_KEY,
  onChange: (oldFlags, params) => {
   if (flagsmith.hasFeature('new-checkout-flow')) {
    app.get("/feat", (_req, res) => {
      res.json({ message: "Feature-Flag" });
    });

   }
  },
 });

// Parse incoming JSON request bodies
app.use(express.json());

/**
 * Health check endpoint
 * Returns a welcome message to verify API is running
 */
app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the Enhanced Express Todo App!" });
});

/**
 * Debug endpoint - only available in development/test environments
 * Exposes environment variables for debugging purposes
 * Automatically disabled when NODE_ENV=production
 */
productionLazyImport(() => {
  app.get("/debug", (_req, res) => {
    res.json({
      secret: process.env.SECRET_KEY,
      api_key: process.env.API_KEY,
    });
  });
});

/**
 * Swagger UI documentation endpoint
 * Serves interactive API documentation at /docs
 */
app.get("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount todo routes under /todos path
app.use("/todos", todoRouter);

// Export app for testing purposes
module.exports = app;

/**
 * Start server only when run directly (not when imported for testing)
 * Supports custom PORT via environment variable, defaults to 3000
 */
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
