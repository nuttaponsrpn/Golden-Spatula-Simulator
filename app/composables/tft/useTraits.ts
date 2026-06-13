// app/composables/tft/useTraits.ts
import { useTftData } from "./useTftData";

export const useTraits = () => {
  const { traits } = useTftData();
  const traitList = computed(() => Object.values(traits.value));

  const byId = (id: string) => computed(() => traits.value[id] ?? null);

  return { traits, traitList, byId };
};
