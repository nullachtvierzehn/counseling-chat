// @ts-check
import * as graphql from "@graphql-eslint/eslint-plugin"
import { loadConfigSync } from "graphql-config"

import withNuxt from "./.nuxt/eslint.config.mjs"

export default withNuxt(
  {
    rules: {
      "no-console": "warn",
      "vue/max-attributes-per-line": [
        "error",
        {
          singleline: { max: 3 },
          multiline: { max: 1 },
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
)
// We had the same issue before prepending.
// https://github.com/dimaMachina/graphql-eslint/issues/480
// https://github.com/dimaMachina/graphql-eslint/blob/v4-1/examples/vue-code-file/eslint.config.js
//
// Stolen from https://github.com/dimaMachina/graphql-eslint/blob/c9cbf6d8065740302cfb75b278733701dd5f7cf6/examples/vue-code-file/eslint.config.js
  .prepend({
    name: "graphql-in-vue",
    files: ["**/*.vue", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs"],
    processor: graphql.processors.graphql,
  },
  {
    name: "graphql",
    files: ["**/*.graphql"],
    languageOptions: {
      parser: graphql.parser,
      parserOptions: { graphQLConfig: loadConfigSync({ filepath: ".graphqlrc.yml", rootDir: "." }) },
    },
    plugins: {
      "@graphql-eslint": {
        rules: /** @type {Record<string, import('eslint').Rule.RuleModule>} */ (graphql.rules)
      },
    },
    rules: {
      ...graphql.configs["flat/operations-recommended"].rules,
      "@graphql-eslint/executable-definitions": "off",
      "@graphql-eslint/no-anonymous-operations": "error",
      "@graphql-eslint/no-duplicate-fields": "error",
      "@graphql-eslint/naming-convention": [
        "error",
        {
          OperationDefinition: {
            style: "PascalCase",
          },
        },
      ],
    },
  })
