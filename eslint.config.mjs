import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Root scripts (Node, CommonJS)
    "convert-jsonl-to-json.js",
    "count-unique-words.js",
    "download-audio.js",
    "extract-topics.js",
    "verify-articles.js",
  ]),
]);

export default eslintConfig;
