// app/plugins/gs-data.server.ts
import { useGsData } from "~/composables/gs/useGsData";

export default defineNuxtPlugin(async () => {
  const { init, initialized } = useGsData();
  if (!initialized.value) {
    console.log("[Gs Data] Starting server-side initialization...");
    const result = await init();
    if (result.status === "error") {
      console.error("[Gs Data Init Error]", result.error);
    } else {
      console.log("[Gs Data] Server-side initialization successful.");
    }
  }
});
