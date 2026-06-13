<template>
  <Teleport to="body">
    <Transition name="modal-fullscreen">
      <div
        v-if="visible && units !== null"
        class="fixed inset-0 z-[200] flex flex-col bg-gray-950 h-dvh"
        role="dialog"
        aria-label="ทีมที่ AI แนะนำ"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between border-b border-gray-800 px-4 py-3">
          <h2 class="text-base font-semibold text-gray-100">ทีมที่ AI แนะนำ</h2>
          <button
            class="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-gray-700 hover:text-gray-100 transition-colors text-xl"
            aria-label="Close"
            @click="$emit('close')"
          >
            &times;
          </button>
        </div>

        <!-- Content -->
        <div v-if="units" class="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 p-4">
          <div class="text-xs text-gray-500">{{ units.length }}/10 ยูนิต</div>

          <div class="shrink-0">
            <ChatBoardPreview :board="previewBoard" :unit-count="units.length" />
          </div>

          <div v-if="activations.length > 0">
            <SynergyPanel :activations="activations" />
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-2 shrink-0 border-t border-gray-800 p-4">
          <ElementBaseButton variant="primary" class="flex-1" @click="load">
            โหลดทีมนี้ลง Board
          </ElementBaseButton>
          <ElementBaseButton variant="secondary" @click="$emit('close')">
            ปิด
          </ElementBaseButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { PlacedUnits, TeamBoard, BoardCell, BoardPosition } from "~/types/team";

const props = defineProps<{
  units: PlacedUnits | null;
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  load: [];
}>();

const BOARD_ROWS = 4;
const BOARD_COLS = 7;

const previewBoard = computed<TeamBoard>(() => {
  const grid: TeamBoard = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      const pos: BoardPosition = { row: r, col: c };
      const unit = (props.units ?? []).find(
        (u) => u.position.row === r && u.position.col === c,
      );
      if (unit) {
        row.push({ status: "occupied", position: pos, unit });
      } else {
        row.push({ status: "empty", position: pos });
      }
    }
    grid.push(row);
  }
  return grid;
});

const { getSynergyActivations } = useSynergies();

const activations = computed(() =>
  props.units ? getSynergyActivations(props.units) : [],
);

function load(): void {
  emit("load");
  emit("close");
}
</script>

<style scoped>
.modal-fullscreen-enter-active,
.modal-fullscreen-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.modal-fullscreen-enter-from,
.modal-fullscreen-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
