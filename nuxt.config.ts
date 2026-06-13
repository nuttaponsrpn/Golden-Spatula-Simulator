export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  modules: ['@nuxtjs/tailwindcss'],
  typescript: { strict: true, typeCheck: true },
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
