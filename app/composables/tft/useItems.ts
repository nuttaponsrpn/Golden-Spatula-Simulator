// app/composables/tft/useItems.ts
import { useTftData } from "./useTftData";
import type { ItemCategory } from "~/types/item";

export const useItems = () => {
  const { items } = useTftData();

  const categories: { value: ItemCategory; label: string }[] = [
    { value: "basic", label: "Components" },
    { value: "combined", label: "Combined" },
    { value: "artifact", label: "Artifacts" },
    { value: "radiant", label: "Radiant" },
    { value: "emblem", label: "Emblems" },
    { value: "special", label: "Special" },
  ];

  const activeCategory = useState<ItemCategory>("item-picker-category", () => "basic");

  const components = computed(() => items.value.filter((i) => i.category === "basic"));
  const combined = computed(() => items.value.filter((i) => i.category === "combined"));

  const filteredItems = computed(() => {
    return items.value.filter((i) => i.category === activeCategory.value);
  });

  const byId = (id: string) =>
    computed(() => items.value.find((i) => i.id === id) ?? null);

  return { 
    items, 
    components, 
    combined, 
    filteredItems, 
    categories, 
    activeCategory, 
    byId 
  };
};
