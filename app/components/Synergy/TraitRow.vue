<template>
  <div
    ref="rowRef"
    :class="[
      'flex flex-col gap-1 rounded-lg p-2 transition-colors cursor-pointer',
      activation.activeTier !== null ? 'bg-gray-800' : 'bg-gray-900/50 opacity-60',
    ]"
    data-testid="trait-row"
    @click="onToggle"
  >
    <div class="flex items-center gap-2">
      <div
        :class="[
          'flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold relative overflow-hidden',
          activation.activeTier !== null ? tierBgClass : 'bg-gray-700 text-gray-400',
        ]"
      >
        <img
          v-if="activation.trait.imageUrl"
          :src="activation.trait.imageUrl"
          class="absolute inset-0 h-full w-full object-contain p-1 opacity-40"
          alt=""
        />
        <span class="relative z-10">{{ activation.activeCount }}</span>
      </div>
      <span
        :class="[
          'text-sm font-medium',
          activation.activeTier !== null ? 'text-gray-100' : 'text-gray-500',
        ]"
      >
        {{ activation.trait.name }}
      </span>
      <SynergyThresholdPips
        :thresholds="activation.trait.thresholds"
        :current-count="activation.activeCount"
        class="ml-auto"
      />
    </div>

    <p
      v-if="activation.activeThreshold"
      class="text-xs text-gray-400"
    >
      {{ activation.activeThreshold.bonus }}
    </p>
    <p
      v-else-if="activation.nextThreshold"
      class="text-xs text-gray-500"
    >
      เพิ่มอีก {{ activation.nextThreshold.count - activation.activeCount }} เพื่อ activate
    </p>
  </div>

  <SynergyTraitTooltip
    :activation="activation"
    :visible="isHovered"
    :anchor-rect="anchorRect"
  />
</template>

<script setup lang="ts">
import type { SynergyActivation } from "~/types/trait";

const props = defineProps<{
  activation: SynergyActivation;
}>();

const rowRef = ref<HTMLElement | null>(null);
const isHovered = ref(false);
const anchorRect = ref<DOMRect | null>(null);

function onToggle(): void {
  if (isHovered.value) {
    isHovered.value = false;
    return;
  }
  anchorRect.value = rowRef.value?.getBoundingClientRect() ?? null;
  isHovered.value = true;
}

function onOutsideClick(e: MouseEvent): void {
  if (rowRef.value && !rowRef.value.contains(e.target as Node)) {
    isHovered.value = false;
  }
}

watch(isHovered, (open) => {
  if (open) {
    document.addEventListener("click", onOutsideClick, { capture: true });
  } else {
    document.removeEventListener("click", onOutsideClick, { capture: true });
  }
});

onUnmounted(() => {
  document.removeEventListener("click", onOutsideClick, { capture: true });
});

const tierBgClass = computed(() => {
  switch (props.activation.activeTier) {
    case "bronze":   return "bg-amber-900 text-tier-bronze";
    case "silver":   return "bg-gray-600 text-tier-silver";
    case "gold":     return "bg-yellow-900 text-tier-gold";
    case "prismatic": return "bg-purple-900 text-tier-prismatic";
    default:          return "bg-gray-700 text-gray-400";
  }
});
</script>
