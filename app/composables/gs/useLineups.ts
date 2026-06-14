// app/composables/gs/useLineups.ts
import { useGsData } from "./useGsData";

export const useLineups = () => {
  const { lineups } = useGsData();

  const byQuality = (q: "S" | "A" | "B" | "C") =>
    computed(() => lineups.value.filter((l) => l.quality === q));

  return { lineups, byQuality };
};
