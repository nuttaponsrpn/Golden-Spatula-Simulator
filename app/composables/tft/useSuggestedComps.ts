import type { SuggestedComp } from "~/types/comp";
import { useTftData } from "./useTftData";

export function useSuggestedComps() {
  const { lineups } = useTftData();

  function getCompById(id: string): SuggestedComp | undefined {
    return lineups.value.find((c) => c.id === id);
  }

  const byQuality = (q: "S" | "A" | "B" | "C") =>
    computed(() => lineups.value.filter((l) => l.quality === q));

  return {
    suggestedComps: lineups,
    getCompById,
    byQuality,
  };
}
