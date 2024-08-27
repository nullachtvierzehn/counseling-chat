// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: "2024-08-25",
  future: {
    compatibilityVersion: 4,
  },
  modules: ["@nuxt/eslint", "@vueuse/nuxt"],
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
