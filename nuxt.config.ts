export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  modules: ["@nuxtjs/tailwindcss", "@vite-pwa/nuxt"],

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Golden Spatula Simulator",
      short_name: "GS Sim",
      description: "Golden Spatula team composition builder with AI advisor",
      theme_color: "#1a1a2e",
      background_color: "#0d0d1a",
      display: "standalone",
      orientation: "portrait",
      scope: "/",
      start_url: "/",
      icons: [
        { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
        { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
        { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
        { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
        { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
        { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
      // No data caching — only precache the app shell
      globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      runtimeCaching: [],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  },
  typescript: { strict: true, typeCheck: true },
  components: {
    dirs: [
      {
        path: "~/components",
        pathPrefix: true,
        global: true,
      },
    ],
  },
  css: ["~/assets/css/tft.css"],
  runtimeConfig: {
    geminiApiKey: "",
    public: {
      apiBase: "",
    },
  },
  imports: {
    dirs: ["composables/**"],
  },
  nitro: {
    // Vercel: allow long-running SSE responses (deepagents/Gemini can take 60–120s)
    vercel: {
      functions: {
        "/api/ai/deepagents": { maxDuration: 300 },
      },
    },
    // Force nitro to include packages that langchain imports dynamically
    // (not detectable via static analysis → would be missing from Vercel bundle)
    externals: {
      inline: ["@langchain/google-genai"],
    },
  },
});
