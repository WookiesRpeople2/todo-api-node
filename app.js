/**
 * Main Express application for Todo API
 * Provides RESTful endpoints for managing todos with SQLite backend
 */
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const todoRouter = require("./routes/todo");
const { createFeatureFlags } = require("./featureFlags");
const logger = require("./logger");

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

const featureFlags = createFeatureFlags({ logger: console });

// Parse incoming JSON request bodies
app.use(express.json());

/**
 * Health check endpoint
 * Returns a welcome message to verify API is running
 */
app.get("/", (_req, res) => {
  logger.info({ path: "/" }, "Welcome endpoint accessed");
  res.json({ message: "Welcome to the Enhanced Express Todo App!" });
});

/**
 * Feature-gated endpoint example.
 * Always registered to keep app behavior deterministic; returns 404 when disabled.
 */
app.get("/feat", (_req, res) => {
  if (!featureFlags.isEnabled("new-checkout-flow")) {
    return res.status(404).json({ detail: "Feature disabled" });
  }
  return res.json({ message: "Feature-Flag" });
});

/* Health endpoint
 * Returns API health status and metadata
 */
app.get("/health", (_req, res) => {
  logger.debug({ path: "/health" }, "Health check endpoint accessed");
  res.json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });
})

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
 * Serves interactive API documentation and static assets at /docs
 */
app.use("/docs", swaggerUi.serveFiles(swaggerDocument), swaggerUi.setup(swaggerDocument));

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
  app.listen(PORT, () => {
    logger.info({ port: PORT, pid: process.pid }, "Server started and listening");
  });
}

