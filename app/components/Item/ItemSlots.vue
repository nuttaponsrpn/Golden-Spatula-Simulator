<template>
  <div class="flex items-center gap-1">
    <ItemSlot
      v-for="(item, index) in items"
      :key="index"
      :item="item"
      @drop="(item) => $emit('item-drop', index as 0 | 1 | 2, item)"
      @remove="() => $emit('item-remove', index as 0 | 1 | 2)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Item, UnitItems } from "~/types/item";

const props = defineProps<{
  items: UnitItems;
}>();

defineEmits<{
  "item-drop": [slotIndex: 0 | 1 | 2, item: Item];
  "item-remove": [slotIndex: 0 | 1 | 2];
}>();
</script>
