<template>
  <div class="flex flex-col gap-3" data-testid="champion-picker">
    <!-- Filter controls -->
    <div class="flex flex-col gap-2">
      <!-- Search -->
      <ElementBaseInput
        v-model="searchQuery"
        placeholder="ค้นหาแชมป์..."
        label="ค้นหาแชมป์"
        data-testid="champion-search"
      >
        <template #icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            />
          </svg>
        </template>
      </ElementBaseInput>

      <!-- Cost / Class / Origin selects -->
      <div class="grid grid-cols-3 gap-1.5" data-testid="champion-filter-selects">
        <ElementBaseSelect
          :model-value="selectedCost ?? ''"
          :options="costOptions"
          placeholder="Cost ทั้งหมด"
          aria-label="กรองตาม Cost"
          data-testid="cost-filter"
          @update:model-value="onCostUpdate"
        />

        <ElementBaseSelect
          :model-value="selectedClassId ?? ''"
          :options="classOptions"
          placeholder="Class ทั้งหมด"
          aria-label="กรองตาม Class"
          data-testid="class-filter"
          @update:model-value="onClassUpdate"
        />

        <ElementBaseSelect
          :model-value="selectedOriginId ?? ''"
          :options="originOptions"
          placeholder="Origin ทั้งหมด"
          aria-label="กรองตาม Origin"
          data-testid="origin-filter"
          @update:model-value="onOriginUpdate"
        />
      </div>
    </div>

    <!-- Champion grid -->
    <div
      class="grid gap-2"
      style="grid-template-columns: repeat(auto-fill, minmax(48px, 48px))"
      data-testid="champion-grid"
    >
      <ChampionCard
        v-for="champion in champions"
        :key="champion.id"
        :champion="champion"
        :is-in-team="isChampionOnBoard(champion.id)"
        :disabled="isBoardFull && !isChampionOnBoard(champion.id)"
        :dimmed="!isChampionVisible(champion)"
        @select="$emit('select', $event)"
        @drag-start="(ev, id) => onPickerDragStart(ev, id)"
        @drag-end="onPickerDragEnd"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChampionCost } from "~/types/champion";
import { useChampions } from "~/composables/tft/useChampions";
import { useSynergies } from "~/composables/tft/useSynergies";
import { useDragDrop } from "~/composables/tft/useDragDrop";

defineProps<{
  isBoardFull: boolean;
  isChampionOnBoard: (id: string) => boolean;
}>();

defineEmits<{
  select: [championId: string];
}>();

const {
  champions,
  isChampionVisible,
  searchQuery,
  selectedCost,
  selectedClassId,
  selectedOriginId,
  setCostFilter,
  setClassFilter,
  setOriginFilter,
} = useChampions();

const { traits } = useSynergies();
const { onPickerDragStart, onPickerDragEnd } = useDragDrop();

const costOptions = [
  { value: "", label: "Cost ทั้งหมด" },
  { value: 1, label: "1 Cost" },
  { value: 2, label: "2 Cost" },
  { value: 3, label: "3 Cost" },
  { value: 4, label: "4 Cost" },
  { value: 5, label: "5 Cost" },
];

const classOptions = computed(() => [
  { value: "", label: "Class ทั้งหมด" },
  ...traits.value
    .filter((t) => t.type === "class")
    .map((t) => ({
      value: t.id,
      label: t.name,
      icon: t.imageUrl,
    })),
]);

const originOptions = computed(() => [
  { value: "", label: "Origin ทั้งหมด" },
  ...traits.value
    .filter((t) => t.type === "origin")
    .map((t) => ({
      value: t.id,
      label: t.name,
      icon: t.imageUrl,
    })),
]);

function onCostUpdate(val: string | number | null): void {
  setCostFilter(val === "" ? null : (Number(val) as ChampionCost));
}

function onClassUpdate(val: string | number | null): void {
  setClassFilter(val === "" || typeof val === "number" ? null : val);
}

function onOriginUpdate(val: string | number | null): void {
  setOriginFilter(val === "" || typeof val === "number" ? null : val);
}
</script>

<style scoped>
.select-filter {
  @apply w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-xs text-gray-100
         focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
         transition-colors cursor-pointer;
  /* ensure touch target height */
  min-height: 36px;
}
</style>
