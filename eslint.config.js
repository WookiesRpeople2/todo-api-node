const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    ignores: ["tests/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
];
