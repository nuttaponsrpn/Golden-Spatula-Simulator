<template>
  <Transition name="delete-zone">
    <div
      v-if="isDraggingUnit"
      class="absolute inset-x-0 bottom-0 z-10 p-2"
      data-testid="delete-zone"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div
        :class="[
          'flex w-full items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition-all duration-150',
          isOver
            ? 'border-red-400 bg-red-500/20 text-red-300'
            : 'border-red-700/50 border-dashed bg-gray-950/80 text-red-500/70',
        ]"
      >
        <span>🗑</span>
        <span>ลากมาที่นี่เพื่อลบ</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  remove: [unitId: string];
}>();

const { isDraggingUnit } = useDragDrop();
const isOver = ref(false);

const DRAG_DATA_KEY = "application/gs-drag";

function onDragEnter(): void {
  isOver.value = true;
}

function onDragLeave(event: DragEvent): void {
  const currentTarget = event.currentTarget as HTMLElement | null;
  if (currentTarget?.contains(event.relatedTarget as Node | null)) return;
  isOver.value = false;
}

function onDrop(event: DragEvent): void {
  isOver.value = false;
  if (!event.dataTransfer) return;

  let payload: unknown;
  try {
    payload = JSON.parse(event.dataTransfer.getData(DRAG_DATA_KEY));
  } catch {
    return;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "kind" in payload &&
    (payload as { kind: string }).kind === "board" &&
    "unitId" in payload &&
    typeof (payload as { unitId: unknown }).unitId === "string"
  ) {
    emit("remove", (payload as { unitId: string }).unitId);
  }
}
</script>

<style scoped>
.delete-zone-enter-active,
.delete-zone-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.delete-zone-enter-from,
.delete-zone-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
