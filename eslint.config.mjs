import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  { files: ["**/*.ts"] },
  { ignores: ["out/", "**/*.js", "**/.d.ts"] },
  { files: ["**/*.ts"], languageOptions: { sourceType: "script" } },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/semi": "warn",
      "comma-dangle": ["warn", "always-multiline"],
      curly: "off",
      "eol-last": "warn",
      eqeqeq: "warn",
      "no-case-declarations": "off",
      "no-empty": "off",
      "no-extra-semi": "warn",
      "no-throw-literal": "warn",
      "prefer-const": "warn",
      quotes: ["warn", "double"],
      semi: "off",
    },
  },
];
