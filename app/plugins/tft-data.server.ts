// app/plugins/tft-data.server.ts
import { useTftData } from "~/composables/tft/useTftData";

export default defineNuxtPlugin(async () => {
  const { init, initialized } = useTftData();
  if (!initialized.value) {
    console.log("[TFT Data] Starting server-side initialization...");
    const result = await init();
    if (result.status === "error") {
      console.error("[TFT Data Init Error]", result.error);
    } else {
      console.log("[TFT Data] Server-side initialization successful.");
    }
  }
});
