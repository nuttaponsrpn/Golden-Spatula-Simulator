<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] bg-gray-950 flex flex-col overflow-hidden fullscreen-overlay"
        role="dialog"
        aria-label="Board Fullscreen Mode"
        aria-modal="true"
      >
        <!-- Fixed UI Controls — outside rotation wrapper so position is always screen-relative -->
        <div class="fixed top-4 right-4 z-[120]">
          <button
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-full border border-indigo-400/50 backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5"
            @click="$emit('close')"
          >
            <span>เสร็จสิ้น</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div class="fixed bottom-4 left-4 z-[120]">
          <button
            class="p-2 bg-gray-800/90 hover:bg-red-500/90 text-white rounded-full border border-gray-700 backdrop-blur-md transition-all shadow-lg"
            title="ล้างบอร์ด"
            @click="$emit('clear')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Rotation Wrapper for Mobile Portrait -->
        <div class="flex-1 relative flex items-center justify-center rotation-wrapper">
          <!-- Board Area -->
          <div class="relative w-full h-full flex flex-col items-center justify-center p-4 bg-battle-bg">
             <div class="board-scale-wrapper">
             <div class="board-container">
                <BoardHexGrid
                  :board="board"
                  :unit-count="unitCount"
                  :max-units="10"
                  :allow-upscale="true"
                  @cell-click="$emit('cell-click', $event)"
                  @remove="$emit('remove', $event)"
                  @clear="$emit('clear')"
                />
             </div>
             </div>

             <!-- Synergies (Bottom Center Floating) -->
             <div class="synergy-bar-container">
               <BoardSynergyBar :activations="activations" class="justify-center" />
             </div>
          </div>
        </div>

        <!-- Landscape Hint Overlay (Temporary for UX) -->
        <Transition name="fade">
          <div v-if="showHint" class="portrait-only-hint fixed inset-0 z-[130] bg-gray-950/80 flex items-center justify-center p-10 pointer-events-none">
             <div class="flex flex-col items-center gap-4 text-center">
                <div class="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-indigo-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
                <p class="text-gray-100 font-bold">เพื่อการใช้งานที่สะดวกที่สุด<br/>กรุณาเอียงจอโทรศัพท์เป็นแนวนอน</p>
             </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { TeamBoard, BoardPosition } from "~/types/team";
import type { SynergyActivation } from "~/types/trait";

const props = defineProps<{
  visible: boolean;
  board: TeamBoard;
  unitCount: number;
  activations: SynergyActivation[];
  isBoardFull: boolean;
  isChampionOnBoard: (id: string) => boolean;
}>();

defineEmits<{
  close: [];
  "cell-click": [position: BoardPosition];
  remove: [unitId: string];
  clear: [];
}>();

const showHint = ref(false);

// Show hint briefly when entering on mobile portrait
watch(() => props.visible, (newVal) => {
  if (newVal && window.innerHeight > window.innerWidth) {
    showHint.value = true;
    setTimeout(() => { showHint.value = false; }, 3000);
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.bg-battle-bg {
  background-color: #030712;
  background-image: 
    radial-gradient(circle at center, rgba(31, 41, 55, 0.4) 0%, rgba(3, 7, 18, 1) 100%),
    url('https://www.transparenttextures.com/patterns/stardust.png');
}

/* Force Landscape Rotation logic on Mobile Portrait */
@media (orientation: portrait) and (max-width: 768px) {
  .rotation-wrapper {
    width: 100vh;
    height: 100vw;
    transform: rotate(90deg);
    transform-origin: center;
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
  }

  .controls-group {
    top: 2rem;
    right: 2rem;
  }
}

/* Board scale wrapper — fill horizontal space, cap at natural board width */
.board-scale-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: min(659px, calc(100vw - 32px));
}

.board-container {
  width: 100%;
}

.synergy-bar-container {
  @apply absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-10 flex justify-center;
}

.delete-zone-container {
  @apply absolute bottom-6 left-6;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
