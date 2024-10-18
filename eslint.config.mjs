// @ts-check
import * as graphql from "@graphql-eslint/eslint-plugin"

import withNuxt from "./.nuxt/eslint.config.mjs"

// Stolen from
// https://github.com/dimaMachina/graphql-eslint/blob/c9cbf6d8065740302cfb75b278733701dd5f7cf6/examples/vue-code-file/eslint.config.js
const graphqlChecks = {
  files: ["**/*.graphql"],
  languageOptions: {
    parser: graphql.parser,
    parserOptions: {
      graphQLConfig: {
        schema: "schema.graphql",
        documents: ["./graphql/**/*.graphql"],
      },
    },
  },
  plugins: {
    "@graphql-eslint": {
      rules: graphql.rules
    },
  },
  rules: {
    ...graphql.configs["flat/operations-recommended"].rules,
    "@graphql-eslint/no-anonymous-operations": "error",
    "@graphql-eslint/no-duplicate-fields": "error",
    "@graphql-eslint/naming-convention": [
      "error",
      {
        OperationDefinition: {
          style: "PascalCase",
          forbiddenPrefixes: ["Query", "Mutation", "Subscription", "Get"],
          forbiddenSuffixes: ["Query", "Mutation", "Subscription"],
        },
      },
    ],
  },
}

const graphqlInVue = {
  files: ["**/*.vue"],
  processor: graphql.processors.graphql,
}

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
  },
  // graphqlInVue,
  graphqlChecks
)
