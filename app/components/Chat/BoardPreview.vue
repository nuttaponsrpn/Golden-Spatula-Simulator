<template>
  <div
    ref="containerRef"
    class="w-full overflow-hidden flex justify-center"
    :style="{ height: `${scaledHeight}px` }"
    data-testid="chat-board-preview"
    aria-label="Team composition preview (read-only)"
  >
    <div
      :style="{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        width: `${BOARD_WIDTH}px`,
        height: `${BOARD_HEIGHT}px`,
        flexShrink: 0,
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
            :is-drag-over="false"
            :is-dragging-board-unit="false"
            :is-drag-source="false"
            :is-dragging-champion="false"
            @click="() => {}"
            @remove="() => {}"
            @drag-enter="() => {}"
            @drag-over="() => {}"
            @drag-leave="() => {}"
            @drop="() => {}"
            @star-change="() => {}"
            @item-drop="() => {}"
            @item-remove="() => {}"
          />
        </div>

        <div class="mt-2 text-xs text-gray-500">
          {{ unitCount }} ยูนิต
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamBoard } from "~/types/team";

const props = defineProps<{
  board: TeamBoard;
  unitCount: number;
}>();

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

const scale = computed(() => containerWidth.value / BOARD_WIDTH);
const scaledHeight = computed(() => BOARD_HEIGHT * scale.value);

// Suppress unused warning — props.board and props.unitCount are used in template
void props;
</script>
