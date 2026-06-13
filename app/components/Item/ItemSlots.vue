<template>
  <div class="flex items-center gap-1">
    <ItemSlot
      v-for="(item, index) in items"
      :key="index"
      :item="item"
      @drop="(droppedItem) => $emit('item-drop', index as 0 | 1 | 2, droppedItem)"
      @open-detail="item && openDetail(item, index as 0 | 1 | 2)"
    />
  </div>

  <ItemDetailModal
    :item="modalItem"
    :visible="modalVisible"
    @close="closeModal"
    @remove="removeItem"
  />
</template>

<script setup lang="ts">
import type { Item, UnitItems } from "~/types/item";

const props = defineProps<{
  items: UnitItems;
}>();

const emit = defineEmits<{
  "item-drop": [slotIndex: 0 | 1 | 2, item: Item];
  "item-remove": [slotIndex: 0 | 1 | 2];
}>();

const modalVisible = ref(false);
const modalItem = ref<Item | null>(null);
const modalSlotIndex = ref<0 | 1 | 2 | null>(null);

function openDetail(item: Item, slotIndex: 0 | 1 | 2): void {
  modalItem.value = item;
  modalSlotIndex.value = slotIndex;
  modalVisible.value = true;
}

function closeModal(): void {
  modalVisible.value = false;
}

function removeItem(): void {
  if (modalSlotIndex.value !== null) {
    emit("item-remove", modalSlotIndex.value);
  }
  modalItem.value = null;
  modalSlotIndex.value = null;
}
</script>
