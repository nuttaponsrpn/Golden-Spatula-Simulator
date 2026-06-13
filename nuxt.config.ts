export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  modules: ['@nuxtjs/tailwindcss'],
  typescript: { strict: true, typeCheck: true },
  components: {
    dirs: [
      {
        path: '~/components',
        pathPrefix: true,
        global: true,
      },
    ],
  },
  css: ['~/assets/css/tft.css'],
  runtimeConfig: {
    geminiApiKey: '',
    public: {
      apiBase: '',
    },
  },
  imports: {
    dirs: [
      'composables/**',
    ],
  },
});
