// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs"

export default withNuxt(
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-console": "warn", // allow console.log in TypeScript files
    },
  },
  {
    rules: {
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
)
