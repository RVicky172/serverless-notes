// @ts-check
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Shared lint rules for every workspace. Each package runs `eslint .` against this file. */
export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**", "docs/api/**", "**/.turbo/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },

  // Project-wide coding standards.
  {
    rules: {
      // Keep every source file small and focused.
      "max-lines": ["error", { max: 250, skipBlankLines: false, skipComments: false }],
      "max-lines-per-function": ["warn", { max: 80, skipBlankLines: true, skipComments: true }],
      complexity: ["warn", 10],
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },

  // Every exported API must carry a JSDoc / TSDoc comment (picked up by TypeDoc).
  {
    files: ["**/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "**/test/**"],
    ...jsdoc.configs["flat/recommended-typescript-error"],
  },
  {
    files: ["**/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "**/test/**"],
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
          },
          contexts: ["TSInterfaceDeclaration", "TSTypeAliasDeclaration"],
        },
      ],
      "jsdoc/require-param": "off",
      "jsdoc/check-param-names": ["error", { checkDestructured: false }],
      "jsdoc/require-returns": "off",
      "jsdoc/tag-lines": ["error", "any", { startLines: 1 }],
    },
  },

  // Node workspaces.
  {
    files: ["apps/api/**/*.ts", "packages/**/*.ts"],
    languageOptions: { globals: globals.node },
  },

  // React workspace.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Components return JSX and hooks return library types; inference is clearer here.
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },

  // Tests may be longer per function and use non-null assertions on fixtures.
  {
    files: ["**/*.test.{ts,tsx}", "**/test/**/*.{ts,tsx}"],
    rules: {
      "max-lines-per-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // Plain JS config files are not part of any tsconfig.
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },

  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
);
