import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    ignores: [
      "node_modules",
      "src/.umi",
      "src/.umi-production",
      "dist",
      "public",
    ],
  },
  { rules: { "@typescript-eslint/no-explicit-any": "off" } },
  eslintConfigPrettier,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      "prettier/prettier": ["error"], // 使用 eslint-plugin-prettier 的规则
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
    },
  },
];
