<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="tooltipRef"
      class="fixed z-50 w-72 max-w-[calc(100vw-16px)] rounded-xl border border-gray-700 bg-gray-900 shadow-2xl pointer-events-none"
      :style="{ top: `${pos.y}px`, left: `${pos.x}px` }"
    >
      <!-- Header -->
      <div
        :class="[
          'flex items-center gap-3 rounded-t-xl px-4 py-3',
          headerBgClass,
        ]"
      >
        <div class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/30">
          <img
            v-if="activation.trait.imageUrl"
            :src="activation.trait.imageUrl"
            :alt="activation.trait.name"
            class="h-8 w-8 object-contain"
          />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-white leading-tight">{{ activation.trait.name }}</p>
          <p class="text-xs text-white/60 capitalize">{{ activation.trait.type }}</p>
        </div>
        <div class="ml-auto text-right">
          <p :class="['text-xl font-black', countColorClass]">{{ activation.activeCount }}</p>
          <p class="text-[10px] text-white/50">หน่วย</p>
        </div>
      </div>

      <!-- Description -->
      <div class="px-4 py-3 border-b border-gray-800">
        <p class="text-xs text-gray-400 leading-relaxed">{{ activation.trait.description }}</p>
      </div>

      <!-- Thresholds -->
      <div class="px-4 py-3 flex flex-col gap-2">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">เกณฑ์การเปิดใช้งาน</p>
        <div
          v-for="threshold in activation.trait.thresholds"
          :key="threshold.count"
          :class="[
            'flex gap-3 rounded-lg p-2.5 transition-colors',
            isActiveThreshold(threshold) ? activeThresholdBg(threshold.tier) : 'bg-gray-800/50',
          ]"
        >
          <!-- Tier badge -->
          <div
            :class="[
              'flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-black',
              isActiveThreshold(threshold) ? tierBadgeActive(threshold.tier) : 'bg-gray-700 text-gray-500',
            ]"
          >
            {{ threshold.count }}
          </div>
          <div class="min-w-0 flex-1">
            <p
              :class="[
                'text-xs leading-relaxed',
                isActiveThreshold(threshold) ? 'text-gray-100' : 'text-gray-500',
              ]"
            >
              {{ threshold.bonus }}
            </p>
          </div>
          <!-- Active indicator -->
          <div v-if="isActiveThreshold(threshold)" class="shrink-0 flex items-center">
            <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded', tierPillClass(threshold.tier)]">
              ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { SynergyActivation, TraitThreshold, TraitTier } from "~/types/trait";

const props = defineProps<{
  activation: SynergyActivation;
  visible: boolean;
  anchorRect: DOMRect | null;
}>();

const tooltipRef = ref<HTMLElement | null>(null);
const pos = ref({ x: 0, y: 0 });

const MARGIN = 8;

watch(
  () => [props.visible, props.anchorRect] as const,
  ([visible, rect]) => {
    if (!visible || !rect) return;
    nextTick(() => {
      const el = tooltipRef.value;
      if (!el) return;
      const tipH = el.offsetHeight;
      const tipW = el.offsetWidth;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const spaceRight = vw - rect.right - MARGIN;
      const spaceLeft = rect.left - MARGIN;
      const spaceBelow = vh - rect.bottom - MARGIN;
      const spaceAbove = rect.top - MARGIN;

      let x: number;
      let y: number;

      if (vw < 640) {
        // Mobile: prefer above/below to avoid horizontal overflow
        x = Math.max(MARGIN, Math.min(rect.left, vw - tipW - MARGIN));

        if (spaceBelow >= tipH || spaceBelow >= spaceAbove) {
          // Below anchor
          y = rect.bottom + MARGIN;
        } else {
          // Above anchor
          y = rect.top - tipH - MARGIN;
        }
        // Final clamp
        y = Math.max(MARGIN, Math.min(y, vh - tipH - MARGIN));
      } else {
        // Desktop: prefer right, fall back to left
        if (spaceRight >= tipW) {
          x = rect.right + MARGIN;
        } else if (spaceLeft >= tipW) {
          x = rect.left - tipW - MARGIN;
        } else {
          // Neither side fits — center horizontally and clamp
          x = Math.max(MARGIN, vw / 2 - tipW / 2);
        }

        // Vertically centered on the anchor, clamped to viewport
        y = rect.top + rect.height / 2 - tipH / 2;
        y = Math.max(MARGIN, Math.min(y, vh - tipH - MARGIN));
      }

      pos.value = { x, y };
    });
  },
  { immediate: true },
);

function isActiveThreshold(threshold: TraitThreshold): boolean {
  return props.activation.activeThreshold?.count === threshold.count;
}

const headerBgClass = computed(() => {
  switch (props.activation.activeTier) {
    case "bronze":   return "bg-amber-950/80";
    case "silver":   return "bg-gray-700/80";
    case "gold":     return "bg-yellow-950/80";
    case "prismatic": return "bg-purple-950/80";
    default:          return "bg-gray-800";
  }
});

const countColorClass = computed(() => {
  switch (props.activation.activeTier) {
    case "bronze":   return "text-tier-bronze";
    case "silver":   return "text-tier-silver";
    case "gold":     return "text-tier-gold";
    case "prismatic": return "text-tier-prismatic";
    default:          return "text-gray-400";
  }
});

function activeThresholdBg(tier: TraitTier): string {
  switch (tier) {
    case "bronze":   return "bg-amber-950/60 border border-amber-900/50";
    case "silver":   return "bg-gray-700/60 border border-gray-600/50";
    case "gold":     return "bg-yellow-950/60 border border-yellow-900/50";
    case "prismatic": return "bg-purple-950/60 border border-purple-900/50";
  }
}

function tierBadgeActive(tier: TraitTier): string {
  switch (tier) {
    case "bronze":   return "bg-amber-900 text-tier-bronze";
    case "silver":   return "bg-gray-600 text-tier-silver";
    case "gold":     return "bg-yellow-900 text-tier-gold";
    case "prismatic": return "bg-purple-900 text-tier-prismatic";
  }
}

function tierPillClass(tier: TraitTier): string {
  switch (tier) {
    case "bronze":   return "bg-amber-900/80 text-tier-bronze";
    case "silver":   return "bg-gray-600/80 text-tier-silver";
    case "gold":     return "bg-yellow-900/80 text-tier-gold";
    case "prismatic": return "bg-purple-900/80 text-tier-prismatic";
  }
}
</script>
