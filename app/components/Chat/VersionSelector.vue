<template>
  <div class="flex items-center gap-2">
    <button
      class="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-600 transition-colors"
      data-testid="chat-version-selector-button"
      @click="openPicker"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3.5 h-3.5 text-gray-400 shrink-0">
        <path fill-rule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7-5.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" clip-rule="evenodd" />
        <path d="M6.5 5.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v2h.75a.75.75 0 0 1 0 1.5H7.25a.75.75 0 0 1 0-1.5H8v-1.25H7.25a.75.75 0 0 1-.75-.75ZM8 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
      </svg>
      <span class="hidden sm:inline">{{ activeVersionInfo?.name ?? `Mode ${activeMode}` }}</span>
      <span class="sm:hidden">{{ activeVersionInfo?.version ?? activeMode }}</span>
    </button>

    <!-- Single modal — switches between picker and confirm views -->
    <ElementBaseModal :visible="modalVisible" :title="modalTitle" @close="closeModal">
      <!-- Version picker view -->
      <div v-show="view === 'picker'" class="flex flex-col gap-3">
        <p class="text-xs text-gray-400">
          เลือก version ที่ต้องการ — ถ้ามีการสนทนาอยู่ จะเริ่ม session ใหม่โดยอัตโนมัติ
        </p>
        <div class="flex flex-col gap-1.5">
          <button
            v-for="v in versions"
            :key="v.mode"
            :class="[
              'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
              v.mode === activeMode
                ? 'border-indigo-600 bg-indigo-950/50 text-gray-100'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600',
            ]"
            :data-testid="`version-option-${v.mode}`"
            @click="onSelect(v.mode)"
          >
            <span class="font-medium text-sm">{{ v.name }}</span>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">{{ v.version }}</span>
              <svg
                v-if="v.mode === activeMode"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                class="w-4 h-4 text-indigo-400"
              >
                <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <!-- Confirm view -->
      <div v-show="view === 'confirm'" class="flex flex-col gap-4">
        <p class="text-sm text-gray-300">
          การสนทนาปัจจุบันใช้ version
          <span class="font-semibold text-gray-100">{{ activeVersionInfo?.name ?? activeMode }}</span>
        </p>
        <p class="text-sm text-gray-300">
          การเปลี่ยนเป็น
          <span class="font-semibold text-gray-100">{{ pendingVersionName }}</span>
          จะเริ่ม <span class="font-semibold text-indigo-400">session ใหม่</span>
          เพราะข้อมูล Champion และ Item จะแตกต่างกัน
        </p>
        <div class="flex gap-2 pt-1">
          <ElementBaseButton variant="primary" @click="confirmChange">
            เริ่ม Session ใหม่
          </ElementBaseButton>
          <ElementBaseButton variant="secondary" @click="backToPicker">
            ย้อนกลับ
          </ElementBaseButton>
        </div>
      </div>
    </ElementBaseModal>
  </div>
</template>

<script setup lang="ts">
import type { GsVersion } from "~/composables/gs/useGsData";

const props = defineProps<{
  hasActiveSession: boolean;
}>();

const emit = defineEmits<{
  "version-change": [mode: string];
}>();

const { versions, activeMode, activeVersionInfo } = useGsData();

type ModalView = "picker" | "confirm";

const modalVisible = ref(false);
const view = ref<ModalView>("picker");
const pendingMode = ref<string | null>(null);

const modalTitle = computed(() =>
  view.value === "confirm" ? "เปลี่ยน Version เกม?" : "เลือก Version เกม",
);

const pendingVersionName = computed(() => {
  const v = versions.value.find((v: GsVersion) => v.mode === pendingMode.value);
  return v?.name ?? pendingMode.value ?? "";
});

function openPicker(): void {
  view.value = "picker";
  modalVisible.value = true;
}

function closeModal(): void {
  modalVisible.value = false;
  pendingMode.value = null;
}

function onSelect(mode: string): void {
  if (mode === activeMode.value) {
    closeModal();
    return;
  }
  if (props.hasActiveSession) {
    pendingMode.value = mode;
    view.value = "confirm";
  } else {
    closeModal();
    emit("version-change", mode);
  }
}

function confirmChange(): void {
  if (!pendingMode.value) return;
  const mode = pendingMode.value;
  closeModal();
  emit("version-change", mode);
}

function backToPicker(): void {
  pendingMode.value = null;
  view.value = "picker";
}
</script>
