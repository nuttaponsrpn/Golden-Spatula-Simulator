<template>
  <button
    ref="cardRef"
    :class="[
      'relative flex h-20 w-12 flex-col items-center justify-start gap-1 transition-all',
      isSelected
        ? 'bg-indigo-900/40'
        : isInTeam
          ? 'opacity-40'
          : 'hover:bg-gray-800/40',
      disabled ? 'cursor-not-allowed opacity-20' : 'cursor-pointer',
      dimmed && !isSelected && !isInTeam ? 'opacity-20 grayscale' : '',
    ]"
    :disabled="disabled"
    :aria-label="`${champion.name}, ${champion.cost}-cost`"
    :aria-pressed="isSelected"
    data-testid="champion-card"
    draggable="true"
    @mouseenter="onMouseEnter"
    @mouseleave="showTooltip = false"
    @click="!disabled && $emit('select', champion.id)"
    @dragstart="!disabled && $emit('drag-start', $event, champion.id)"
    @dragend="$emit('drag-end', $event)"
  >
    <div
      class="relative h-12 w-12 overflow-hidden rounded border-2"
      :style="{ borderColor: costBorderColor }"
    >
      <img
        v-if="champion.imageUrl"
        :src="champion.imageUrl"
        :alt="champion.name"
        class="h-full w-full object-cover"
        loading="lazy"
        @error="onImageError"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gray-700 text-lg font-bold text-gray-400"
      >
        {{ champion?.name?.[0] ?? "?" }}
      </div>
    </div>

    <span class="line-clamp-2 w-full break-words text-center text-[10px] leading-tight text-gray-300">
      {{ champion.name }}
    </span>

    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="showTooltip && tooltipPos"
          class="fixed z-[9999] pointer-events-none"
          :style="{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }"
        >
          <ChampionTooltip :champion="champion" />
        </div>
      </Transition>
    </Teleport>
  </button>
</template>

<script setup lang="ts">
import type { Champion } from "~/types/champion";

const props = defineProps<{
  champion: Champion;
  isSelected?: boolean;
  isInTeam?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
}>();

defineEmits<{
  select: [championId: string];
  "drag-start": [event: DragEvent, championId: string];
  "drag-end": [event: DragEvent];
}>();

const cardRef = ref<HTMLElement | null>(null);
const showTooltip = ref(false);
const tooltipPos = ref<{ x: number; y: number } | null>(null);

const COST_COLORS: Record<number, string> = {
  1: '#9e9e9e',
  2: '#4caf50',
  3: '#2196f3',
  4: '#9c27b0',
  5: '#ffc107',
};
const costBorderColor = computed(() => COST_COLORS[props.champion.cost] ?? '#9e9e9e');

function onMouseEnter(): void {
  if (!cardRef.value) return;
  const rect = cardRef.value.getBoundingClientRect();
  const TOOLTIP_WIDTH = 224;
  const spaceRight = window.innerWidth - rect.right;
  const x = spaceRight >= TOOLTIP_WIDTH + 8
    ? rect.right + 8
    : rect.left - TOOLTIP_WIDTH - 8;
  tooltipPos.value = { x, y: rect.top };
  showTooltip.value = true;
}

function onImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
}
</script>

<style scoped>
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
