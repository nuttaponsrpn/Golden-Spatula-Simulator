<template>
  <div
    class="relative w-[22px] h-[22px] rounded bg-black/20 border border-white/10 flex items-center justify-center cursor-pointer transition-all duration-200 touch-target"
    :class="[
      isOver ? 'border-yellow-400/50 bg-yellow-400/10' : 'hover:border-white/30',
    ]"
    @dragenter.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @dragover.prevent
    @drop.prevent.stop="onDrop"
    @click="item && $emit('open-detail')"
  >
    <!-- Empty Slot -->
    <template v-if="!item">
      <span class="text-white/10 text-[14px] font-bold">+</span>
    </template>

    <!-- Occupied Slot -->
    <template v-else>
      <div
        class="w-full h-full flex items-center justify-center overflow-hidden rounded bg-gray-800 text-[9px] font-bold text-white uppercase"
        :title="item.name"
      >
        <img
          v-if="item.imageUrl"
          :src="item.imageUrl"
          :alt="item.name"
          class="w-full h-full object-cover"
        />
        <span v-else>{{ item.name.charAt(0) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Item, ItemSlot } from "~/types/item";

const props = defineProps<{
  item: ItemSlot;
}>();

const emit = defineEmits<{
  drop: [item: Item];
  "open-detail": [];
}>();

const isOver = ref(false);

const onDragEnter = () => {
  isOver.value = true;
};

const onDragLeave = () => {
  isOver.value = false;
};

const onDrop = (event: DragEvent) => {
  isOver.value = false;

  const raw = event.dataTransfer?.getData("application/tft-drag");
  if (!raw) return;

  try {
    const payload = JSON.parse(raw);
    if (payload.kind === "item-picker" && payload.itemId) {
      emit("drop", { id: payload.itemId } as Item);
    }
  } catch (e) {
    console.error("Failed to parse drag payload", e);
  }
};
</script>
