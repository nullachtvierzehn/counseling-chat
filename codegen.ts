import type { CodegenConfig } from "@graphql-codegen/cli"
import type { Types } from "@graphql-codegen/plugin-helpers"
import { loadConfigSync } from "graphql-config"

import { addTypenameSelectionDocumentTransform, type ClientPresetConfig } from "@graphql-codegen/client-preset"

const _generateComposables: Types.ConfiguredOutput = {
  plugins: [
    { add: { content: "/* eslint-disable */" } },
    { add: { content: "/* DO NOT EDIT! This file is auto-generated by graphql-code-generator - see `codegen.ts` */" } },
    "typescript",
    "typescript-operations",
    "typescript-vue-urql"
  ],
  config: {
    enumsAsTypes: true,
    useTypeImports: true
  }
}

const graphqlRc = loadConfigSync({ filepath: ".graphqlrc.yml", rootDir: "./" })

const config: CodegenConfig = {
  schema: graphqlRc.getDefault().schema,
  // schema: "./schema.graphql",
  documents: graphqlRc.getDefault().documents,
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    // "./app/composables/graphql-queries.ts": _generateComposables,
    "./app/utils/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: false,
        persistedDocuments: true,
      } satisfies ClientPresetConfig,
      documentTransforms: [addTypenameSelectionDocumentTransform]
    }
  },
}

export default config
