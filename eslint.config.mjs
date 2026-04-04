import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import travelProPlugin from "./eslint-rules/index.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "tmp/**",
    "next-env.d.ts",
    "eslint-rules/**",
    "evals/**",
    "public/sw.js",
    // Scripts and config files are not part of the app — skip strict rules
    "scripts/**",
    "prisma/seed.ts",
    "eslint.config.mjs",
    "lint-staged.config.mjs",
    "next-sitemap.config.js",
    "postcss.config.mjs",
    "prisma.config.ts",
  ]),
  // Stricter rules for catching common agent-introduced mistakes
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Forbid console.log left in production code — use the logger utility instead
      "no-console": ["error", { allow: ["warn", "error", "info"] }],

      // Catch unawaited async calls in Next.js API routes and server actions
      "@typescript-eslint/no-floating-promises": "error",

      // Catch circular imports — disabled in pre-commit for speed; run in CI
      // "import/no-cycle": ["error", { maxDepth: 3, ignoreExternal: true }],
    },
  },
  // Design-system enforcement
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "travel-pro": travelProPlugin,
    },
    rules: {
      // Flag hardcoded hex colors in Tailwind arbitrary values — use design tokens instead
      "travel-pro/no-hardcoded-colors": "warn",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/db/*", "@/lib/services/*"],
              message:
                "These paths were removed. Import from '@/lib/core/*' for infrastructure and '@/lib/features/*' for services.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
