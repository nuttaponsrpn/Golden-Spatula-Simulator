<template>
  <div
    :class="[
      'flex items-center gap-1.5 rounded-full px-2 py-1 transition-all duration-200',
      isActive ? 'bg-gray-800 ring-1 ring-gray-600/60' : 'bg-gray-900/40 opacity-65',
    ]"
    :title="`${activation.trait.name} (${activation.activeCount}/${nextThresholdCount})`"
    :data-testid="`synergy-badge-${activation.trait.id}`"
  >
    <img
      v-if="activation.trait.imageUrl"
      :src="activation.trait.imageUrl"
      :alt="activation.trait.name"
      :class="['h-4 w-4 shrink-0 object-contain', isActive ? tierIconClass : 'brightness-90']"
    />
    <span
      v-else
      :class="['h-4 w-4 shrink-0 rounded-sm', isActive ? 'bg-gray-500' : 'bg-gray-700']"
    />

    <span
      :class="[
        'text-[11px] font-medium leading-none',
        isActive ? 'text-gray-200' : 'text-gray-500',
      ]"
    >
      {{ activation.trait.name }}
    </span>

    <span
      :class="['text-[11px] font-bold leading-none', isActive ? tierCountClass : 'text-gray-500']"
    >
      {{ activation.activeCount }}/{{ nextThresholdCount }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { SynergyActivation } from "~/types/trait";

const props = defineProps<{
  activation: SynergyActivation;
}>();

const isActive = computed(() => props.activation.activeTier !== null);

const nextThresholdCount = computed(() => {
  if (props.activation.nextThreshold) return props.activation.nextThreshold.count;
  if (props.activation.activeThreshold) return props.activation.activeThreshold.count;
  return props.activation.trait.thresholds[0]?.count ?? 0;
});

const tierIconClass = computed(() => {
  switch (props.activation.activeTier) {
    case "bronze":
      return "drop-shadow-[0_0_3px_rgba(180,83,9,0.8)]";
    case "silver":
      return "drop-shadow-[0_0_3px_rgba(156,163,175,0.8)]";
    case "gold":
      return "drop-shadow-[0_0_3px_rgba(234,179,8,0.8)]";
    case "prismatic":
      return "drop-shadow-[0_0_3px_rgba(168,85,247,0.8)]";
    default:
      return "";
  }
});

const tierCountClass = computed(() => {
  switch (props.activation.activeTier) {
    case "bronze":
      return "text-amber-600";
    case "silver":
      return "text-gray-300";
    case "gold":
      return "text-yellow-400";
    case "prismatic":
      return "text-purple-400";
    default:
      return "text-gray-400";
  }
});
</script>
