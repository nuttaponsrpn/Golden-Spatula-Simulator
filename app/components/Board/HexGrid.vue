<template>
  <div
    ref="containerRef"
    class="w-full overflow-hidden flex justify-center"
    data-testid="hex-grid"
    aria-label="Team board"
  >
    <div
      :style="{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        width: `${BOARD_WIDTH}px`,
        height: `${scaledHeight}px`,
      }"
    >
      <div class="flex flex-col gap-8">
        <div
          v-for="(row, rowIndex) in board"
          :key="rowIndex"
          :class="['flex gap-4', rowIndex % 2 !== 0 ? 'hex-row-odd' : '']"
        >
          <BoardHexCell
            v-for="cell in row"
            :key="`${cell.position.row}-${cell.position.col}`"
            :cell="cell"
            :is-drag-over="
              dragOverPosition?.row === cell.position.row &&
              dragOverPosition?.col === cell.position.col
            "
            :is-dragging-board-unit="isDraggingUnit"
            :is-drag-source="cell.status === 'occupied' && cell.unit.id === draggingUnitId"
            :is-dragging-champion="isDragging"
            @click="$emit('cell-click', $event)"
            @remove="$emit('remove', $event)"
            @drag-enter="onCellDragEnter(cell.position)"
            @drag-over="(pos, ev) => onCellDragOver(ev, pos)"
            @drag-leave="(pos, ev) => onCellDragLeave(ev, pos)"
            @drop="(pos, ev) => onCellDrop(ev, pos)"
            @item-drop="onItemDrop"
            @item-remove="onItemRemove"
          />
        </div>

        <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{{ unitCount }}/{{ maxUnits }} ยูนิต</span>
          <button
            v-if="unitCount > 0"
            class="text-gray-400 hover:text-red-400 transition-colors"
            data-testid="clear-board-button"
            @click="$emit('clear')"
          >
            ล้างบอร์ด
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamBoard, BoardPosition } from "~/types/team";
import type { Item } from "~/types/item";
import { useItems } from "~/composables/tft/useItems";

const props = defineProps<{
  board: TeamBoard;
  unitCount: number;
  maxUnits: number;
}>();

defineEmits<{
  "cell-click": [position: BoardPosition];
  remove: [unitId: string];
  clear: [];
}>();

// Board natural dimensions:
// 7 cells × 74px + 6 gaps × 16px (gap-4) = 614px
// odd row offset = 74/2 + 8 = 45px → total = 659px
// height: 4 rows × 65px + 3 gaps × 32px (gap-8) + item slots padding
const BOARD_WIDTH = 659;
const BOARD_HEIGHT = 470;

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(BOARD_WIDTH);

onMounted(() => {
  if (!containerRef.value) return;
  containerWidth.value = containerRef.value.offsetWidth;
  const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (entry) containerWidth.value = entry.contentRect.width;
  });
  observer.observe(containerRef.value);
  onUnmounted(() => observer.disconnect());
});

const scale = computed(() =>
  containerWidth.value < BOARD_WIDTH ? containerWidth.value / BOARD_WIDTH : 1,
);

const scaledHeight = computed(() => BOARD_HEIGHT * scale.value);

const { byId } = useItems();
const { addItemToUnit, removeItemFromUnit } = useTeamBuilder();
const {
  dragOverPosition,
  isDragging,
  isDraggingUnit,
  draggingUnitId,
  onCellDragEnter,
  onCellDragOver,
  onCellDragLeave,
  onCellDrop,
} = useDragDrop();

function onItemDrop(unitId: string, slotIndex: 0 | 1 | 2, item: Item): void {
  const fullItem = byId(item.id).value;
  if (fullItem) {
    addItemToUnit(unitId, slotIndex, fullItem);
  }
}

function onItemRemove(unitId: string, slotIndex: 0 | 1 | 2): void {
  removeItemFromUnit(unitId, slotIndex);
}
</script>
