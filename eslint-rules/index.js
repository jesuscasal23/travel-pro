const noHardcodedColors = require("./no-hardcoded-colors");

/** @type {import("eslint").ESLint.Plugin} */
const plugin = {
  rules: {
    "no-hardcoded-colors": noHardcodedColors,
  },
};

module.exports = plugin;
