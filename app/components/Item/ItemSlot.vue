<template>
  <div
    class="relative w-[22px] h-[22px] rounded bg-black/20 border border-white/10 flex items-center justify-center cursor-pointer transition-all duration-200"
    :class="[
      isOver ? 'border-yellow-400/50 bg-yellow-400/10' : 'hover:border-white/30',
      item ? 'group' : '',
    ]"
    @dragenter.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <!-- Empty Slot -->
    <template v-if="!item">
      <span class="text-white/10 text-[14px] font-bold transition-colors group-hover:text-white/20"
        >+</span
      >
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

      <!-- Remove Button -->
      <button
        class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
        @click.stop="$emit('remove')"
      >
        <span class="text-[7px] text-white leading-none">×</span>
      </button>
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
  remove: [];
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
