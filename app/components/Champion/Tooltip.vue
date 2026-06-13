<template>
  <div
    class="pointer-events-none w-72 rounded-lg border border-gray-600/60 bg-gray-900/95 p-3 shadow-2xl backdrop-blur-sm"
    data-testid="champion-tooltip"
  >
    <p class="mb-2 text-sm font-bold text-gray-100">{{ champion.name }}</p>

    <div class="mb-2 flex flex-col gap-1">
      <div
        v-for="traitId in champion.traits"
        :key="traitId"
        class="flex items-center gap-1.5"
      >
        <img
          v-if="getTraitById(traitId)?.imageUrl"
          :src="getTraitById(traitId)!.imageUrl"
          :alt="getTraitById(traitId)!.name"
          class="h-4 w-4 object-contain"
        />
        <span v-else class="h-4 w-4 rounded-sm bg-gray-600" />
        <span class="text-xs text-gray-300">{{ getTraitById(traitId)?.name ?? traitId }}</span>
      </div>
    </div>

    <div class="mb-2 rounded bg-gray-800/80 p-2">
      <div class="mb-1 flex items-center gap-1.5">
        <img
          v-if="champion.ability.iconUrl"
          :src="champion.ability.iconUrl"
          :alt="champion.ability.name"
          class="h-5 w-5 rounded object-cover"
        />
        <span class="text-xs font-semibold text-gray-100">{{ champion.ability.name }}</span>
        <span v-if="champion.ability.mana" class="ml-auto flex items-center gap-0.5 text-xs text-blue-400">
          <span class="inline-block h-2 w-2 rounded-full bg-blue-400" />
          {{ champion.ability.mana }}
        </span>
      </div>
      <p class="text-[11px] leading-relaxed text-gray-400">{{ champion.ability.description }}</p>
      <p v-if="champion.ability.scalingValues" class="mt-1 text-[11px] text-gray-500">
        {{ champion.ability.scalingValues }}
      </p>
    </div>

    <div v-if="champion.damage > 0" class="flex items-center justify-between border-t border-gray-700/60 pt-2">
      <span class="text-[11px] text-gray-400">Damage</span>
      <span class="text-[11px] font-semibold text-orange-400">{{ champion.damage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Champion } from "~/types/champion";

defineProps<{
  champion: Champion;
}>();

const { getTraitById } = useSynergies();
</script>
