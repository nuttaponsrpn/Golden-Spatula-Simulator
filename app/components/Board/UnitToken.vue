<template>
  <div
    ref="tokenRef"
    class="group relative flex h-full w-full flex-col items-center justify-center"
    data-testid="unit-token"
    draggable="true"
    @mouseenter="onMouseEnter"
    @mouseleave="showTooltip = false"
    @dragstart="
      showTooltip = false;
      onTokenDragStart($event, {
        kind: 'board',
        championId: unit.championId,
        unitId: unit.id,
      })
    "
    @dragend="onTokenDragEnd($event)"
  >
    <img
      v-if="champion?.imageUrl"
      :src="champion.imageUrl"
      :alt="champion.name"
      class="h-full w-full object-cover"
      loading="lazy"
      @error="onImageError"
    />
    <div
      v-else
      class="flex h-full w-full items-center justify-center text-sm font-bold text-gray-300"
    >
      {{ champion?.name?.[0] ?? "?" }}
    </div>

<Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="showTooltip && champion && tooltipPos"
          class="fixed z-[9999] pointer-events-none"
          :style="{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }"
        >
          <ChampionTooltip :champion="champion" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { TeamUnit } from "~/types/team";

const props = defineProps<{
  unit: TeamUnit;
}>();

const { onTokenDragStart, onTokenDragEnd } = useDragDrop();
const { getChampionById } = useChampions();
const champion = computed(() => getChampionById(props.unit.championId));

const tokenRef = ref<HTMLElement | null>(null);
const showTooltip = ref(false);
const tooltipPos = ref<{ x: number; y: number } | null>(null);

function onMouseEnter(): void {
  if (!tokenRef.value) return;
  const rect = tokenRef.value.getBoundingClientRect();
  const TOOLTIP_WIDTH = 288; // w-72 = 18rem = 288px
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
