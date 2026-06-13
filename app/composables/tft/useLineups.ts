// app/composables/tft/useLineups.ts
import { useTftData } from "./useTftData";

export const useLineups = () => {
  const { lineups } = useTftData();

  const byQuality = (q: "S" | "A" | "B" | "C") =>
    computed(() => lineups.value.filter((l) => l.quality === q));

  return { lineups, byQuality };
};
