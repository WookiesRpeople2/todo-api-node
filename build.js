const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

/**
 * Recursively copy a directory
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

esbuild.build({
  entryPoints: ["app.js"],
  bundle: true,
  platform: "node",
  outfile: "dist/app.js",
  external: [
    "pino",
    "pino-pretty",
    "swagger-ui-express",
    "express",
    "sql.js",
    "./logger.js",
    "../logger.js",
    "./database/database.js",
    "../database/database.js"
  ],
  define: {
    "process.env.NODE_ENV": '"production"'
  }
}).then(() => {
  console.log("JS bundled successfully.");

  // Ensure dist directory exists
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist", { recursive: true });
  }

  // Copy local source files that won't be bundled
  const filesToCopy = [
    { src: "logger.js", dest: "dist/logger.js" },
    { src: "swagger.json", dest: "dist/swagger.json" }
  ];

  filesToCopy.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`${src} copied to dist/`);
    }
  });

  // Copy directories
  const dirsToCopy = [
    { src: "database", dest: "dist/database" },
    { src: "routes", dest: "dist/routes" }
  ];

  dirsToCopy.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      copyDirSync(src, dest);
      console.log(`${src}/ copied to dist/`);
    }
  });

  const wasmSrc = path.join(__dirname, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
  const wasmDest = path.join(__dirname, "dist", "sql-wasm.wasm");

  fs.copyFileSync(wasmSrc, wasmDest);
  console.log("sql-wasm.wasm copied to dist/");
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
