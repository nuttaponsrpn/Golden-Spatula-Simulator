export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  modules: ['@nuxtjs/tailwindcss'],
  typescript: { strict: true, typeCheck: true },
  css: ['~/assets/css/tft.css'],
  runtimeConfig: {
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
