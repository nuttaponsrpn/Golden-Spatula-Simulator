import type { Champion, ChampionCost } from "~/types/champion";
import { useGsData } from "./useGsData";

export function useChampions() {
  const { champions } = useGsData();

  const searchQuery = useState<string>("gs-champion-search", () => "");
  const selectedTraitId = useState<string | null>(
    "gs-champion-trait-filter",
    () => null,
  );
  const selectedCost = useState<ChampionCost | null>(
    "gs-champion-cost-filter",
    () => null,
  );
  const selectedClassId = useState<string | null>(
    "gs-champion-class-filter",
    () => null,
  );
  const selectedOriginId = useState<string | null>(
    "gs-champion-origin-filter",
    () => null,
  );

  const isChampionVisible = computed<(c: Champion) => boolean>(() => {
    const query = searchQuery.value.toLowerCase().trim();
    const cost = selectedCost.value;
    const classId = selectedClassId.value;
    const originId = selectedOriginId.value;

    return (c: Champion) => {
      const matchesSearch = query === "" || c.name.toLowerCase().includes(query);
      const matchesCost = cost === null || c.cost === cost;
      const matchesClass = classId === null || c.traits.includes(classId);
      const matchesOrigin = originId === null || c.traits.includes(originId);
      return matchesSearch && matchesCost && matchesClass && matchesOrigin;
    };
  });

  // kept for backwards compatibility — used by other composables
  const filteredChampions = computed<Champion[]>(() =>
    champions.value.filter((c) => isChampionVisible.value(c)),
  );

  function setSearch(q: string): void {
    searchQuery.value = q;
  }

  function setTraitFilter(traitId: string | null): void {
    selectedTraitId.value = traitId;
  }

  function setCostFilter(cost: ChampionCost | null): void {
    selectedCost.value = cost;
  }

  function setClassFilter(classId: string | null): void {
    selectedClassId.value = classId;
  }

  function setOriginFilter(originId: string | null): void {
    selectedOriginId.value = originId;
  }

  function getChampionById(id: string): Champion | undefined {
    return champions.value.find((c) => c.id === id);
  }

  const byCost = (cost: ChampionCost) =>
    computed(() => champions.value.filter((c) => c.cost === cost));

  const byTrait = (traitId: string) =>
    computed(() => champions.value.filter((c) => c.traits.includes(traitId)));

  return {
    champions,
    filteredChampions,
    isChampionVisible,
    searchQuery,
    selectedTraitId,
    selectedCost,
    selectedClassId,
    selectedOriginId,
    setSearch,
    setTraitFilter,
    setCostFilter,
    setClassFilter,
    setOriginFilter,
    getChampionById,
    byCost,
    byTrait,
  };
}
