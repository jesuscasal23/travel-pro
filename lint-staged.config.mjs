/** @type {import('lint-staged').Config} */
const config = {
  // App source files: ESLint + Prettier (exclude e2e — Playwright tests use browser globals)
  "src/**/*.{ts,tsx,mts}": ["eslint --fix --no-warn-ignored", "prettier --write"],
  // E2E specs: Prettier only (typed linting not configured for Playwright)
  "e2e/**/*.{ts,tsx}": ["prettier --write"],
  // Scripts and config: Prettier only
  "*.{js,mjs,cjs}": ["prettier --write"],
  "scripts/**/*.{ts,js}": ["prettier --write"],
  // Data files: Prettier only
  "*.{json,css,md}": ["prettier --write"],
};

export default config;
