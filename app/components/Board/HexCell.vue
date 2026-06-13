<template>
  <div class="relative flex flex-col items-center pb-[24px] w-[74px]">
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
      @dragenter="$emit('drag-enter', cell.position)"
      @dragover.prevent="$emit('drag-over', cell.position, $event)"
      @dragleave="$emit('drag-leave', cell.position, $event)"
      @drop.prevent="$emit('drop', cell.position, $event)"
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
          <line x1="19" y1="16" x2="19" y2="25" stroke="white" stroke-width="1.5" stroke-linecap="round" />
          <line x1="14.5" y1="20.5" x2="23.5" y2="20.5" stroke="white" stroke-width="1.5" stroke-linecap="round" />
        </g>
        <!-- Grey overlay on swappable occupied cells -->
        <polygon
          v-if="isDraggingBoardUnit && cell.status === 'occupied' && !isDragSource"
          points="19,0.5 37.5,10.25 37.5,30.75 19,40.5 0.5,30.75 0.5,10.25"
          fill="rgba(0,0,0,0.35)"
        />
        <!-- Swap icon: shown on occupied cells (except the dragged one) when dragging a board unit -->
        <g v-if="isDraggingBoardUnit && cell.status === 'occupied' && !isDragSource" class="swap-icon">
          <!-- circular background -->
          <circle cx="19" cy="20.5" r="9" fill="rgba(0,0,0,0.55)" />
          <!-- top arrow (pointing right) -->
          <path d="M14 17.5 H22 M20 15.5 L22 17.5 L20 19.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <!-- bottom arrow (pointing left) -->
          <path d="M24 23.5 H16 M18 21.5 L16 23.5 L18 25.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
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

defineEmits<{
  click: [position: BoardPosition];
  remove: [unitId: string];
  "drag-enter": [position: BoardPosition];
  "drag-over": [position: BoardPosition, event: DragEvent];
  "drag-leave": [position: BoardPosition, event: DragEvent];
  drop: [position: BoardPosition, event: DragEvent];
  "item-drop": [unitId: string, slotIndex: 0 | 1 | 2, item: Item];
  "item-remove": [unitId: string, slotIndex: 0 | 1 | 2];
}>();
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
  0%, 100% { opacity: 0.75; }
  50% { opacity: 1; }
}
</style>
