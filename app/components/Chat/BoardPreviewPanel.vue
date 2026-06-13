<template>
  <Transition name="slide-panel">
    <div
      v-if="visible && units"
      class="flex flex-col h-full min-h-0"
      data-testid="chat-board-preview-panel"
    >
      <!-- Fixed header -->
      <div class="shrink-0 border-b border-gray-800 px-4 py-3 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-200">ทีมที่ AI แนะนำ</h3>
          <span class="text-xs text-gray-500">{{ units.length }}/10 ยูนิต</span>
        </div>
        <select
          v-if="revisions && revisions.length > 1"
          :value="selectedRevisionId ?? ''"
          class="w-full rounded bg-gray-800 border border-gray-700 px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-gray-500"
          @change="emit('revision-change', ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="(rev, index) in revisions"
            :key="rev.id"
            :value="rev.id"
          >
            Revision {{ index + 1 }} — {{ new Date(rev.timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) }}
          </option>
        </select>
      </div>

      <!-- Scrollable content -->
      <div class="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0 p-4">
        <div class="shrink-0">
          <ChatBoardPreview :board="previewBoard" :unit-count="units.length" />
        </div>

        <div v-if="activations.length > 0" class="shrink-0">
          <SynergyPanel :activations="activations" />
        </div>
      </div>

      <!-- Fixed footer -->
      <div class="shrink-0 border-t border-gray-800 p-4">
        <ElementBaseButton variant="primary" class="w-full" @click="$emit('load')">
          โหลดทีมนี้ลง Board
        </ElementBaseButton>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { PlacedUnits, TeamBoard, BoardCell, BoardPosition } from "~/types/team";
import type { ChatMessage } from "~/types/chat";

const props = defineProps<{
  units: PlacedUnits | null;
  visible: boolean;
  revisions?: ChatMessage[];
  selectedRevisionId?: string | null;
}>();

const emit = defineEmits<{
  load: [];
  "revision-change": [messageId: string];
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
</script>

<style scoped>
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
