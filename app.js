/**
 * Main Express application for Todo API
 * Provides RESTful endpoints for managing todos with SQLite backend
 */
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const todoRouter = require("./routes/todo");
const logger = require("./logger.js");

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
 * Health endpoint
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
 * Serves interactive API documentation and static assets at /docs
 */
app.use("/docs", swaggerUi.serveFiles(swaggerDocument), swaggerUi.setup(swaggerDocument));

// Mount todo routes under /todos path
app.use("/todos", todoRouter);

/**
 * Start the Express server
 * Listens on the specified or configured PORT
 * Logs startup information for observability
 * @param {number} port - Port number to listen on (default: 3000)
 * @param {string} host - Host to bind to (default: undefined/localhost)
 * @returns {http.Server} The server instance
 */
const startServer = (port = process.env.PORT || 3000, host = undefined) => {
  const server = app.listen(port, host, () => {
    logger.info({ port, pid: process.pid }, "Server started and listening");
  });
  return server;
};

// Export app and startServer for testing and external use
module.exports = app;
module.exports.startServer = startServer;

/**
 * Start server only when run directly (not when imported for testing)
 * Supports custom PORT via environment variable, defaults to 3000
 */
if (require.main === module) {
  startServer();
}
