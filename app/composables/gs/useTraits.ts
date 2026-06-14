// app/composables/gs/useTraits.ts
import { useGsData } from "./useGsData";

export const useTraits = () => {
  const { traits } = useGsData();
  const traitList = computed(() => Object.values(traits.value));

  const byId = (id: string) => computed(() => traits.value[id] ?? null);

  return { traits, traitList, byId };
};
