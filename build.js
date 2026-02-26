const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

esbuild.build({
  entryPoints: ["app.js"],
  bundle: true,
  platform: "node",
  outfile: "dist/app.js",
  define: {
    "process.env.NODE_ENV": '"production"'
  }
}).then(() => {
  console.log("JS bundled successfully.");

  const wasmSrc = path.join(__dirname, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
  const wasmDest = path.join(__dirname, "dist", "sql-wasm.wasm");

  if (!fs.existsSync(path.dirname(wasmDest))) {
    fs.mkdirSync(path.dirname(wasmDest), { recursive: true });
  }

  fs.copyFileSync(wasmSrc, wasmDest);
  console.log("sql-wasm.wasm copied to dist/");
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
