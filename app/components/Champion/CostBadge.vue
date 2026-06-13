<template>
  <span
    :class="[
      'flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-gray-900',
      costColor,
    ]"
    :aria-label="`${cost}-cost champion`"
  >
    {{ cost }}
  </span>
</template>

<script setup lang="ts">
import type { ChampionCost } from "~/types/champion";

const props = defineProps<{
  cost: ChampionCost;
}>();

const costColor = computed(() => {
  switch (props.cost) {
    case 1:
      return "bg-cost-1";
    case 2:
      return "bg-cost-2";
    case 3:
      return "bg-cost-3";
    case 4:
      return "bg-cost-4 text-gray-100";
    case 5:
      return "bg-cost-5";
  }
});
</script>
