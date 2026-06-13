<template>
  <div class="flex items-center gap-1" :aria-label="`${currentCount} of ${maxCount} units`">
    <div
      v-for="threshold in thresholds"
      :key="threshold.count"
      :class="[
        'flex h-5 items-center justify-center rounded px-1.5 text-xs font-bold transition-colors',
        currentCount >= threshold.count
          ? tierActiveClass(threshold.tier)
          : 'bg-gray-700 text-gray-500',
      ]"
      :title="threshold.bonus"
    >
      {{ threshold.count }}
    </div>
    <span class="ml-1 text-xs text-gray-400">{{ currentCount }}</span>
  </div>
</template>

<script setup lang="ts">
import type { TraitThreshold, TraitTier } from "~/types/trait";

const props = defineProps<{
  thresholds: TraitThreshold[];
  currentCount: number;
}>();

const maxCount = computed(() => {
  if (!props.thresholds || props.thresholds.length === 0) return 0;
  const last = props.thresholds[props.thresholds.length - 1];
  return last?.count ?? 0;
});

function tierActiveClass(tier: TraitTier): string {
  switch (tier) {
    case "bronze":
      return "bg-amber-900 text-tier-bronze";
    case "silver":
      return "bg-gray-600 text-tier-silver";
    case "gold":
      return "bg-yellow-900 text-tier-gold";
    case "prismatic":
      return "bg-purple-900 text-tier-prismatic";
  }
}
</script>
