import pluginJs from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  { files: ["**/*.?(c|m)ts", "*.mjs"] },
  { ignores: ["**/node_modules/**", "out/**/*.?(c|m)js", "**/*.d.?(c|m)ts"] },
  {
    languageOptions: {
      globals: globals.node,
      parser: tsParser,
      sourceType: "script",
    },
  },
  { plugins: { "@typescript-eslint": typescriptEslint } },
  pluginJs.configs.recommended,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": ["warn", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/prefer-ts-expect-error": "warn",
      "comma-dangle": ["warn", "always-multiline"],
      "func-style": ["warn", "declaration"],
      "getter-return": "off",
      indent: ["warn", 2, { SwitchCase: 1 }],
      "no-case-declarations": "off",
      "no-dupe-class-members": "off",
      "no-duplicate-imports": ["warn", { includeExports: true }],
      "no-empty": "off",
      "no-redeclare": "off",
      "no-undef": "off",
      "no-unreachable": "warn",
      "no-unused-private-class-members": "warn",
      "no-unused-vars": "off",
      "prefer-const": "warn",
      "prefer-object-has-own": "warn",
      "prefer-regex-literals": "warn",
      quotes: ["warn", "double"],
      semi: ["warn", "always"],
    },
  },
];
