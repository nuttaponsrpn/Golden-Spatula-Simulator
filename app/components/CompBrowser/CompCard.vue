<template>
  <div
    class="flex flex-col gap-3 rounded-xl border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600"
    data-testid="comp-card"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="font-semibold text-gray-100">{{ comp.name }}</h3>
        <span
          :class="[
            'text-xs',
            comp.difficulty === 'easy'
              ? 'text-cost-2'
              : comp.difficulty === 'medium'
                ? 'text-cost-5'
                : 'text-red-400',
          ]"
        >
          {{ difficultyLabel }}
        </span>
      </div>
      <ElementBaseButton variant="primary" @click="$emit('load', comp)">
        Load
      </ElementBaseButton>
    </div>

    <p class="text-sm text-gray-400 line-clamp-2">{{ comp.description }}</p>

    <div class="flex flex-wrap gap-1.5">
      <div
        v-for="champId in comp.championIds.slice(0, 9)"
        :key="champId"
        class="relative h-10 w-10 overflow-hidden rounded"
        :style="`border: 2px solid var(--cost-${getChampionById(champId)?.cost ?? 1})`"
        :title="getChampionById(champId)?.name ?? champId"
      >
        <img
          v-if="getChampionById(champId)?.imageUrl"
          :src="getChampionById(champId)!.imageUrl"
          :alt="getChampionById(champId)!.name"
          class="h-full w-full object-cover"
          loading="lazy"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-gray-700 text-xs font-bold text-gray-400"
        >
          {{ (getChampionById(champId)?.name ?? champId)[0] }}
        </div>
      </div>
    </div>

    <CompBrowserTraitSummary :key-traits="comp.keyTraits" />

    <p class="text-xs text-gray-500 italic">{{ comp.playstyle }}</p>
  </div>
</template>

<script setup lang="ts">
import type { SuggestedComp } from "~/types/comp";

const props = defineProps<{
  comp: SuggestedComp;
}>();

defineEmits<{
  load: [comp: SuggestedComp];
}>();

const { getChampionById } = useChampions();

const difficultyLabel = computed(() => {
  switch (props.comp.difficulty) {
    case "easy":
      return "ง่าย";
    case "medium":
      return "ปานกลาง";
    case "hard":
      return "ยาก";
  }
});
</script>
