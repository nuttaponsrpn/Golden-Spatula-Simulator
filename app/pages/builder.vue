<template>
  <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
    <div
      class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"
    ></div>
    <p class="text-gray-400 font-medium">กำลังโหลดข้อมูล TFT...</p>
  </div>

  <div
    v-else-if="!initialized"
    class="flex flex-col items-center justify-center py-20 gap-4 text-center"
  >
    <div class="text-red-500 mb-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-16 w-16 mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
    <h2 class="text-xl font-bold text-gray-100">โหลดข้อมูลไม่สำเร็จ</h2>
    <p class="text-gray-400 max-w-md">
      เกิดข้อผิดพลาดในการดึงข้อมูลจาก Golden Spatula API กรุณาลองใหม่อีกครั้ง
    </p>
    <button
      class="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
      @click="init"
    >
      ลองใหม่
    </button>
  </div>

  <div v-else class="flex flex-col gap-4 overflow-x-hidden">
    <!-- Layout: Picker + Board -->
    <div class="flex flex-col lg:flex-row items-stretch gap-4">
      <!-- Picker Section (Tabs) — stacked on mobile, sidebar on desktop -->
      <section
        v-if="!isFullscreenOpen"
        class="min-w-0 rounded-xl border border-gray-800 bg-gray-900 p-4 w-full lg:w-[380px] xl:w-[552px] shrink-0 flex flex-col gap-4 overflow-y-auto max-h-[500px] lg:max-h-[calc(100vh-10rem)]"
      >
        <!-- Picker Tabs -->
        <div
          class="grid grid-cols-2 gap-1 p-1 w-fit bg-gray-950/50 rounded-lg border border-gray-800/50 shrink-0"
        >
          <button
            v-for="tab in ['Champions', 'Items']"
            :key="tab"
            class="w-32 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all text-center"
            :class="[
              activePickerTab === tab
                ? 'bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)] border border-indigo-500/20'
                : 'text-gray-500 hover:text-gray-400 hover:bg-gray-900/50 border border-transparent',
            ]"
            @click="activePickerTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Picker Content — scrollable, fills remaining height -->
        <div class="relative flex-1 min-h-0">
          <!-- Champion Picker Content -->
          <div
            class="flex flex-col gap-3 transition-opacity duration-200"
            :class="[
              activePickerTab === 'Champions'
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none h-0 overflow-hidden',
            ]"
          >
            <h2 class="text-[10px] font-bold uppercase tracking-wider text-gray-500">เลือกแชมป์</h2>
            <ChampionPicker
              :is-board-full="isBoardFull"
              :is-champion-on-board="isChampionOnBoard"
              @select="onChampionSelect"
            />
          </div>

          <!-- Item Picker Content -->
          <div
            class="flex flex-col gap-3 transition-opacity duration-200"
            :class="[
              activePickerTab === 'Items'
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none h-0 overflow-hidden',
            ]"
          >
            <h2 class="text-[10px] font-bold uppercase tracking-wider text-gray-500">ไอเทม</h2>
            <ItemPicker />
          </div>
        </div>
      </section>

      <!-- Board Section -->
      <section
        class="relative min-w-0 flex-1 rounded-xl border border-gray-800 bg-gray-900 p-4"
        :class="{ 'hidden': isFullscreenOpen }"
      >
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">บอร์ด</h2>
          <button
            class="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-bold text-gray-300 transition-all hover:border-indigo-500 hover:text-indigo-400"
            @click="isFullscreenOpen = true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            <span>ขยายบอร์ด</span>
          </button>
        </div>
        <BoardHexGrid
          :board="board"
          :unit-count="unitCount"
          :max-units="10"
          @cell-click="onCellClick"
          @remove="removeUnit"
          @clear="clearBoard"
        />
        <BoardSynergyBar :activations="synergyActivations" />
        <BoardDeleteZone @remove="removeUnit" />
      </section>
    </div>

    <!-- Fullscreen Mode Modal -->
    <BoardFullscreenModal
      :visible="isFullscreenOpen"
      :board="board"
      :unit-count="unitCount"
      :activations="synergyActivations"
      :is-board-full="isBoardFull"
      :is-champion-on-board="isChampionOnBoard"
      @close="isFullscreenOpen = false"
      @cell-click="onCellClick"
      @remove="removeUnit"
      @clear="clearBoard"
    />

    <!-- AI Advisor (Full Width) -->
    <section v-if="!isFullscreenOpen" class="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">AI Advisor</h2>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <AdvisorScoreDisplay :score="score" />
          <AdvisorBreakdownPanel :score="score" class="w-full sm:flex-1" />
        </div>
        <AdvisorSuggestionList :suggestions="suggestions" />
      </div>
    </section>
  </div>

  <!-- Champion Detail Modal -->
  <ChampionDetailModal
    :champion="selectedChampion"
    :visible="isDetailModalOpen"
    @close="closeDetailModal"
  />
</template>

<script setup lang="ts">
import type { Champion } from "~/types/champion";
import type { BoardPosition } from "~/types/team";

useHead({ title: "Builder — Golden Spatula Simulator" });

const {
  board,
  teamUnits,
  unitCount,
  isBoardFull,
  addUnit,
  removeUnit,
  clearBoard,
  isChampionOnBoard,
} = useTeamBuilder();

const { loading, initialized, init } = useTftData();
const { analyzeComp, getSuggestions } = useCompAnalyzer();
const { getChampionById } = useChampions();
const { getSynergyActivations } = useSynergies();

const synergyActivations = computed(() => getSynergyActivations(teamUnits.value));

// Tab state for pickers
const activePickerTab = useState<"Champions" | "Items">("active-picker-tab", () => "Champions");

onMounted(() => {
  if (!initialized.value) {
    init();
  }
});

const score = computed(() => analyzeComp(teamUnits.value));
const suggestions = computed(() => getSuggestions(score.value, teamUnits.value));

// Fullscreen state
const isFullscreenOpen = ref(false);

// Detail modal state
const selectedChampion = ref<Champion | null>(null);
const isDetailModalOpen = ref(false);

function onChampionSelect(championId: string): void {
  if (isChampionOnBoard(championId)) {
    const unit = teamUnits.value.find((u) => u.championId === championId);
    if (unit) removeUnit(unit.id);
  } else {
    addUnit(championId);
  }
}

function onCellClick(position: BoardPosition): void {
  const unit = teamUnits.value.find(
    (u) => u.position.row === position.row && u.position.col === position.col,
  );
  if (unit) {
    const champ = getChampionById(unit.championId);
    if (champ) {
      selectedChampion.value = champ;
      isDetailModalOpen.value = true;
    }
  }
}

function closeDetailModal(): void {
  isDetailModalOpen.value = false;
  selectedChampion.value = null;
}
</script>
