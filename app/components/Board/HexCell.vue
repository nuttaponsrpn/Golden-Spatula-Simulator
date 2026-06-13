<template>
  <div
    class="relative flex flex-col items-center pb-[24px] w-[74px]"
    @dragenter.prevent="$emit('drag-enter', cell.position)"
    @dragover.prevent="$emit('drag-over', cell.position, $event)"
    @dragleave="$emit('drag-leave', cell.position, $event)"
    @drop.prevent="$emit('drop', cell.position, $event)"
  >
    <!-- Star row above hex -->
    <div
      v-if="cell.status === 'occupied'"
      class="absolute -top-[22px] z-20 flex gap-[2px] items-center justify-center w-full"
      @mousedown.stop
      @mouseleave="hoveredStar = 0"
    >
      <button
        v-for="star in 3"
        :key="star"
        class="p-0 leading-none cursor-pointer"
        :aria-label="`${star} ดาว`"
        @mouseenter="hoveredStar = star"
        @click.stop="onStarClick(star as 1 | 2 | 3)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 12 12"
          aria-hidden="true"
          :style="{ filter: hoveredStar > 0 && star <= hoveredStar ? 'drop-shadow(0 0 2px #fbbf2499)' : 'none', transform: hoveredStar > 0 && star <= hoveredStar ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s, filter 0.1s' }"
        >
          <polygon
            points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5"
            :fill="getStarFill(star)"
            :stroke="getStarStroke(star)"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- Cost border: outer hex rendered behind the cell -->
    <div
      v-if="cell.status === 'occupied'"
      class="hex-border-outer pointer-events-none absolute"
      :style="{ backgroundColor: costBorderColor }"
      aria-hidden="true"
    />

    <div
      :class="[
        'hex-cell relative cursor-pointer',
        cell.status === 'empty' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-700',
      ]"
      :aria-label="
        cell.status === 'occupied'
          ? `Row ${cell.position.row + 1}, Column ${cell.position.col + 1} — occupied`
          : `Row ${cell.position.row + 1}, Column ${cell.position.col + 1} — empty`
      "
      :data-testid="`hex-cell-${cell.position.row}-${cell.position.col}`"
      @click="$emit('click', cell.position)"
    >
      <BoardUnitToken
        v-if="cell.status === 'occupied'"
        :unit="cell.unit"
        @remove="$emit('remove', $event)"
      />

      <!-- SVG hex stroke overlay — sits on top of clip-path fill -->
      <svg
        class="absolute inset-0 pointer-events-none"
        width="38"
        height="41"
        viewBox="0 0 38 41"
        aria-hidden="true"
      >
        <polygon
          points="19,0.5 37.5,10.25 37.5,30.75 19,40.5 0.5,30.75 0.5,10.25"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          stroke-width="1"
        />
        <!-- Bright overlay on empty cells when dragging a board unit -->
        <polygon
          v-if="isDraggingChampion && cell.status === 'empty'"
          points="19,0.5 37.5,10.25 37.5,30.75 19,40.5 0.5,30.75 0.5,10.25"
          fill="rgba(255,255,255,0.08)"
        />
        <!-- Plus icon for empty cells -->
        <g v-if="cell.status === 'empty'" opacity="0.25">
          <line
            x1="19"
            y1="16"
            x2="19"
            y2="25"
            stroke="white"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <line
            x1="14.5"
            y1="20.5"
            x2="23.5"
            y2="20.5"
            stroke="white"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </g>
        <!-- Grey overlay on swappable occupied cells -->
        <polygon
          v-if="isDraggingBoardUnit && cell.status === 'occupied' && !isDragSource"
          points="19,0.5 37.5,10.25 37.5,30.75 19,40.5 0.5,30.75 0.5,10.25"
          fill="rgba(0,0,0,0.35)"
        />
        <!-- Swap icon: shown on occupied cells (except the dragged one) when dragging a board unit -->
        <g
          v-if="isDraggingBoardUnit && cell.status === 'occupied' && !isDragSource"
          class="swap-icon"
        >
          <!-- circular background -->
          <circle cx="19" cy="20.5" r="9" fill="rgba(0,0,0,0.55)" />
          <!-- top arrow (pointing right) -->
          <path
            d="M14 17.5 H22 M20 15.5 L22 17.5 L20 19.5"
            stroke="white"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />
          <!-- bottom arrow (pointing left) -->
          <path
            d="M24 23.5 H16 M18 21.5 L16 23.5 L18 25.5"
            stroke="white"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />
        </g>
        <polygon
          v-if="isDragOver"
          points="19,0.5 37.5,10.25 37.5,30.75 19,40.5 0.5,30.75 0.5,10.25"
          fill="rgba(129,140,248,0.25)"
          stroke="#818cf8"
          stroke-width="2.5"
          stroke-opacity="0.9"
        />
      </svg>
    </div>

    <!-- Item Slots below hexagon -->
    <div class="absolute bottom-0 z-10 flex w-full justify-center">
      <ItemSlots
        :items="cell.status === 'occupied' ? cell.unit.items : [null, null, null]"
        @item-drop="
          (slotIndex, item) =>
            cell.status === 'occupied' && $emit('item-drop', cell.unit.id, slotIndex, item)
        "
        @item-remove="
          (slotIndex) => cell.status === 'occupied' && $emit('item-remove', cell.unit.id, slotIndex)
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BoardCell, BoardPosition } from "~/types/team";
import type { Item } from "~/types/item";

const props = defineProps<{
  cell: BoardCell;
  isDragOver?: boolean;
  isDraggingBoardUnit?: boolean;
  isDragSource?: boolean;
  isDraggingChampion?: boolean;
}>();

const { getChampionById } = useChampions();

const COST_COLORS: Record<number, string> = {
  1: "#9e9e9e",
  2: "#4caf50",
  3: "#2196f3",
  4: "#9c27b0",
  5: "#ffc107",
};

const costBorderColor = computed(() => {
  if (props.cell.status !== "occupied") return "transparent";
  const champion = getChampionById(props.cell.unit.championId);
  return COST_COLORS[champion?.cost ?? 1] ?? "#9e9e9e";
});

const emit = defineEmits<{
  click: [position: BoardPosition];
  remove: [unitId: string];
  "star-change": [unitId: string, stars: 1 | 2 | 3];
  "drag-enter": [position: BoardPosition];
  "drag-over": [position: BoardPosition, event: DragEvent];
  "drag-leave": [position: BoardPosition, event: DragEvent];
  drop: [position: BoardPosition, event: DragEvent];
  "item-drop": [unitId: string, slotIndex: 0 | 1 | 2, item: Item];
  "item-remove": [unitId: string, slotIndex: 0 | 1 | 2];
}>();

const hoveredStar = ref(0);

function getStarFill(star: number): string {
  if (hoveredStar.value > 0) {
    return star <= hoveredStar.value ? "#fbbf24" : "rgba(255,255,255,0.15)";
  }
  if (props.cell.status !== "occupied") return "rgba(255,255,255,0.15)";
  return star <= props.cell.unit.stars ? "#fbbf24" : "rgba(255,255,255,0.15)";
}

function getStarStroke(star: number): string {
  if (hoveredStar.value > 0) {
    return star <= hoveredStar.value ? "#f59e0b" : "rgba(255,255,255,0.25)";
  }
  if (props.cell.status !== "occupied") return "rgba(255,255,255,0.25)";
  return star <= props.cell.unit.stars ? "#f59e0b" : "rgba(255,255,255,0.25)";
}

function onStarClick(star: 1 | 2 | 3): void {
  if (props.cell.status !== "occupied") return;
  const current = props.cell.unit.stars;
  const next = (star === current && current > 1 ? current - 1 : star) as 1 | 2 | 3;
  emit("star-change", props.cell.unit.id, next);
}
</script>

<style scoped>
/* Outer hex is 5px larger on each side to create the visible border */
.hex-border-outer {
  width: 43px;
  height: 46px;
  top: -2.5px;
  left: calc(50% - 21.5px);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  z-index: 0;
}

.hex-cell {
  position: relative;
  z-index: 1;
}

.swap-icon {
  animation: swap-pulse 1.2s ease-in-out infinite;
}

@keyframes swap-pulse {
  0%,
  100% {
    opacity: 0.75;
  }
  50% {
    opacity: 1;
  }
}
</style>
