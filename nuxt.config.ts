// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@vueuse/nuxt", "@nuxt/ui", "@pinia/nuxt", "nuxt-security"],
  devtools: { enabled: true },
  css: [
    "prosemirror-view/style/prosemirror.css",
    "prosemirror-example-setup/style/style.css",
    "prosemirror-menu/style/menu.css"
  ],
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: "2024-08-25",
  nitro: {
    experimental: {
      websocket: true,
    },
  },
  typescript: {
    tsConfig: {
      include: ["../shims.d.ts"],
    }
  },
  eslint: {
    config: {
      stylistic: {
        // https://eslint.style/guide/config-presets#configuration-factory
        indent: 2,
        semi: false,
        quotes: "double",
        commaDangle: "only-multiline",
      },
    },
  },
})
