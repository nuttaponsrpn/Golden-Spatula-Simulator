<template>
  <ElementBaseModal
    :visible="visible"
    :title="item?.name ?? ''"
    @close="$emit('close')"
  >
    <div v-if="item" class="flex flex-col gap-4">
      <!-- Header: icon + name + category -->
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
            {{ item.name[0] }}
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-base font-bold text-gray-100">{{ item.name }}</span>
          <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded w-fit" :class="categoryClass">
            {{ item.category }}
          </span>
        </div>
      </div>

      <!-- Component recipe -->
      <div v-if="item.components" class="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2">
        <template v-for="(compId, idx) in item.components" :key="compId">
          <div class="flex items-center gap-1.5">
            <img
              :src="componentItem(compId)?.imageUrl ?? ''"
              :alt="componentItem(compId)?.name ?? compId"
              class="w-6 h-6 rounded object-cover"
            />
            <span class="text-xs text-gray-300">{{ componentItem(compId)?.name ?? compId }}</span>
          </div>
          <span v-if="idx === 0" class="text-gray-500 text-sm">+</span>
        </template>
      </div>

      <!-- Stats -->
      <div v-if="item.stats.length > 0" class="flex flex-col gap-1.5 rounded-lg bg-gray-800 px-3 py-2">
        <div v-for="stat in item.stats" :key="stat.name" class="flex items-center gap-2">
          <span class="text-sm font-bold text-yellow-400 min-w-[3rem] text-right">{{ stat.value }}</span>
          <span class="text-sm text-gray-300">{{ stat.name }}</span>
        </div>
      </div>

      <!-- Effect / description -->
      <p v-if="item.effect" class="text-sm text-gray-300 leading-relaxed">{{ item.effect }}</p>
      <p v-else-if="item.description" class="text-sm text-gray-300 leading-relaxed">{{ item.description }}</p>

      <!-- Footer: remove button bottom-left -->
      <div class="flex items-center justify-start border-t border-gray-800 pt-3 mt-1">
        <button
          class="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:border-red-500/70 active:bg-red-500/30"
          data-testid="item-detail-remove"
          @click="$emit('remove'); $emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
          นำออก
        </button>
      </div>
    </div>
  </ElementBaseModal>
</template>

<script setup lang="ts">
import type { Item, ItemCategory } from "~/types/item";

const props = defineProps<{
  item: Item | null;
  visible: boolean;
}>();

defineEmits<{
  close: [];
  remove: [];
}>();

const { items } = useItems();

const componentItem = (id: string) => items.value.find((i) => i.id === id) ?? null;

const CATEGORY_CLASSES: Record<ItemCategory, string> = {
  basic:    "bg-gray-700/60 text-gray-300",
  combined: "bg-blue-500/15 text-blue-400",
  radiant:  "bg-yellow-500/15 text-yellow-400",
  artifact: "bg-purple-500/15 text-purple-400",
  emblem:   "bg-emerald-500/15 text-emerald-400",
  special:  "bg-rose-500/15 text-rose-400",
  other:    "bg-gray-700/60 text-gray-300",
};

const categoryClass = computed(() =>
  props.item ? (CATEGORY_CLASSES[props.item.category] ?? CATEGORY_CLASSES.other) : ""
);
</script>
