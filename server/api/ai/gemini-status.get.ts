import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  return { available: !!config.geminiApiKey };
});
