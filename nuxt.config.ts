// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  typescript: {
    tsConfig: {
      include: ["../shims.d.ts"]
    }
  },
  devtools: { enabled: true },
  compatibilityDate: "2024-08-25",
  future: {
    compatibilityVersion: 4,
  },
  css: [
    "prosemirror-view/style/prosemirror.css",
    "prosemirror-example-setup/style/style.css",
    "prosemirror-menu/style/menu.css"
  ],
  modules: ["@nuxt/eslint", "@vueuse/nuxt", "@nuxt/ui"],
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
  nitro: {
    experimental: {
      websocket: true,
    },
  },
})
