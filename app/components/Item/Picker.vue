<template>
  <div class="space-y-4">
    <!-- Category Tabs -->
    <div class="flex flex-wrap gap-2 pb-2">
      <button
        v-for="cat in categories"
        :key="cat.value"
        class="px-3 py-1 text-[10px] font-bold uppercase rounded border transition-all"
        :class="[
          activeCategory === cat.value
            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
            : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
        ]"
        @click="activeCategory = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Items Grid -->
    <div class="flex flex-wrap gap-2">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="relative w-10 h-10 sm:w-12 sm:h-12 rounded bg-gray-800 border border-gray-700 p-1 cursor-grab active:cursor-grabbing hover:border-yellow-400/50 transition-colors"
        draggable="true"
        @dragstart="onItemDragStart($event, item)"
        @dragend="onItemDragEnd"
        @mouseenter="showTooltip($event, item)"
        @mouseleave="hideTooltip"
      >
        <div
          class="w-full h-full flex items-center justify-center overflow-hidden rounded bg-gray-900 text-[10px] font-bold text-white uppercase"
        >
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <span v-else>{{ item.name.charAt(0) }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredItems.length === 0"
      class="py-8 text-center text-gray-600 text-sm border-2 border-dashed border-gray-900 rounded"
    >
      No items found in this category
    </div>
  </div>

  <!-- Tooltip teleported to body to escape all overflow:hidden ancestors -->
  <Teleport to="body">
    <Transition name="tooltip">
      <div
        v-if="tooltip.visible && tooltip.item"
        class="fixed z-[9999] w-72 p-3 bg-gray-950 rounded border border-gray-700 shadow-xl pointer-events-none"
        :style="tooltipStyle"
      >
        <!-- Header: icon + name -->
        <div class="flex items-center gap-2 mb-2">
          <img v-if="tooltip.item.imageUrl" :src="tooltip.item.imageUrl" :alt="tooltip.item.name" class="w-7 h-7 rounded object-cover shrink-0" />
          <span class="text-[13px] font-bold text-yellow-400 leading-tight">{{ tooltip.item.name }}</span>
        </div>

        <!-- Component recipe -->
        <template v-if="tooltip.item.components">
          <div class="flex items-center gap-1.5 mb-2">
            <template v-for="(compId, idx) in tooltip.item.components" :key="compId">
              <div class="flex items-center gap-1">
                <img
                  :src="itemsById[compId]?.imageUrl ?? `https://goldenspatula.com/act/jkxzlk-equip/equip/${compId}.png`"
                  :alt="itemsById[compId]?.name ?? compId"
                  class="w-5 h-5 rounded object-cover"
                />
                <span class="text-[10px] text-gray-300">{{ itemsById[compId]?.name ?? compId }}</span>
              </div>
              <span v-if="idx === 0" class="text-gray-500 text-[10px]">+</span>
            </template>
          </div>
        </template>

        <!-- Stats -->
        <template v-if="tooltip.item.stats.length > 0">
          <div v-for="stat in tooltip.item.stats" :key="stat.name" class="flex items-center gap-1.5 leading-snug">
            <span class="text-[11px] font-bold text-white min-w-[2.5rem] text-right">{{ stat.value }}</span>
            <span class="text-[11px] text-gray-300">{{ stat.name }}</span>
          </div>
        </template>

        <!-- Effect / passive -->
        <p v-if="tooltip.item.effect" class="mt-2 text-[10px] text-gray-400 leading-snug border-t border-gray-800 pt-2">{{ tooltip.item.effect }}</p>

        <!-- Description fallback -->
        <p v-if="tooltip.item.stats.length === 0 && !tooltip.item.effect && tooltip.item.description" class="text-[10px] text-gray-400 leading-snug">{{ tooltip.item.description }}</p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Item } from "~/types/item";
import { useItems } from "~/composables/tft/useItems";
import { useDragDrop } from "~/composables/tft/useDragDrop";

const TOOLTIP_WIDTH = 288; // w-72
const TOOLTIP_OFFSET = 8;

const { items, filteredItems, categories, activeCategory } = useItems();
const { onItemDragStart, onItemDragEnd } = useDragDrop();

const itemsById = computed<Record<string, Item>>(() =>
  Object.fromEntries(items.value.map((i) => [i.id, i]))
);

const tooltip = reactive<{ visible: boolean; item: Item | null; x: number; y: number }>({
  visible: false,
  item: null,
  x: 0,
  y: 0,
});

// aboveAnchor = true  → tooltip bottom edge aligns to item top  (bottom: vh - rect.top + offset)
// aboveAnchor = false → tooltip top edge aligns to item bottom  (top: rect.bottom + offset)
const aboveAnchor = ref(true);

function showTooltip(event: MouseEvent, item: Item): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  tooltip.item = item;
  tooltip.visible = true;

  // Center horizontally on the item, clamp within viewport
  let x = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  x = Math.max(8, Math.min(x, window.innerWidth - TOOLTIP_WIDTH - 8));
  tooltip.x = x;

  // Prefer above; fall back to below when too close to top
  aboveAnchor.value = rect.top > 200;
  tooltip.y = aboveAnchor.value
    ? rect.top - TOOLTIP_OFFSET
    : rect.bottom + TOOLTIP_OFFSET;
}

function hideTooltip(): void {
  tooltip.visible = false;
}

const tooltipStyle = computed(() => ({
  left: `${tooltip.x}px`,
  ...(aboveAnchor.value
    ? { bottom: `${window.innerHeight - tooltip.y}px`, top: 'auto' }
    : { top: `${tooltip.y}px` }),
}));
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
