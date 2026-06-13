<template>
  <div class="flex flex-col gap-2" data-testid="breakdown-panel">
    <div
      v-for="dim in score.dimensions"
      :key="dim.label"
      class="flex flex-col gap-1"
    >
      <div class="flex items-center justify-between text-xs">
        <span class="text-gray-300">{{ dim.label }}</span>
        <span class="text-gray-400">{{ dim.feedback }}</span>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          :class="['h-full rounded-full transition-all duration-300', barColor(dim.value)]"
          :style="`width: ${dim.value}%`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CompScore } from "~/types/comp";

defineProps<{
  score: CompScore;
}>();

function barColor(value: number): string {
  if (value >= 80) return "bg-cost-2";
  if (value >= 55) return "bg-cost-3";
  if (value >= 35) return "bg-cost-5";
  return "bg-red-500";
}
</script>
