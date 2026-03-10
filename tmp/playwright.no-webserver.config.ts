import baseConfig from "../playwright.config";

export default {
  ...baseConfig,
  testDir: "../e2e",
  use: {
    ...baseConfig.use,
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? baseConfig.use?.baseURL,
  },
  webServer: undefined,
};
