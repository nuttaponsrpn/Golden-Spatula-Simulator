<template>
  <ElementBaseModal
    :visible="visible"
    :title="champion?.name ?? ''"
    @close="$emit('close')"
  >
    <div v-if="champion" class="flex flex-col gap-4">
      <div class="flex items-start gap-4">
        <div
          class="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg"
          :style="`border: 3px solid var(--cost-${champion.cost})`"
        >
          <img
            v-if="champion.imageUrl"
            :src="champion.imageUrl"
            :alt="champion.name"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-gray-700 text-2xl font-bold text-gray-400"
          >
            {{ champion.name[0] }}
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-bold text-gray-100">{{ champion.name }}</h3>
            <ChampionCostBadge :cost="champion.cost" />
          </div>
          <div class="flex flex-wrap gap-1">
            <ChampionTraitBadge
              v-for="traitId in champion.traits"
              :key="traitId"
              :trait-id="traitId"
              :trait-name="getTraitById(traitId)?.name ?? traitId"
              :icon-url="getTraitById(traitId)?.imageUrl"
            />
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-gray-800 p-3">
        <div class="mb-2 flex items-center gap-2">
          <img
            v-if="champion.ability.iconUrl"
            :src="champion.ability.iconUrl"
            class="h-6 w-6 shrink-0 rounded object-contain"
            alt=""
          />
          <div
            v-else
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.644 1.59a.75.75 0 0 1 .712 0l9.75 5.25a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.712 0l-9.75-5.25a.75.75 0 0 1 0-1.32l9.75-5.25Z" />
              <path d="m3.265 10.602 7.668 4.129a2.25 2.25 0 0 0 2.134 0l7.668-4.13 1.37.739a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.71 0l-9.75-5.25a.75.75 0 0 1 0-1.32l1.37-.738Z" />
              <path d="m10.933 19.231-7.668-4.13-1.37.739a.75.75 0 0 0 0 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 0 0 0-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 0 1-2.134-.001Z" />
            </svg>
          </div>
          <span class="text-sm font-semibold text-indigo-400">{{ champion.ability.name }}</span>
          <span
            v-if="champion.ability.mana"
            class="ml-auto text-xs text-blue-400"
          >
            {{ champion.ability.mana }} Mana
          </span>
        </div>
        <p class="text-sm text-gray-300">{{ champion.ability.description }}</p>
      </div>

      <div class="flex flex-col gap-2">
        <h4 class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" d="M2.25 4.125c0-1.036.84-1.875 1.875-1.875h5.25c1.036 0 1.875.84 1.875 1.875V17.25a4.5 4.5 0 1 1-9 0V4.125Zm4.5 14.25a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clip-rule="evenodd" />
            <path d="M10.719 21.75h9.156c1.036 0 1.875-.84 1.875-1.875v-5.25c0-1.036-.84-1.875-1.875-1.875h-.14l-8.742 8.742c-.09.089-.18.175-.274.258ZM12.738 17.625l6.474-6.474a1.875 1.875 0 0 0 0-2.651L15.5 4.787a1.875 1.875 0 0 0-2.651 0l-.1.099V17.25c0 .126-.003.251-.01.375Z" />
          </svg>
          Traits
        </h4>
        <div
          v-for="traitId in champion.traits"
          :key="traitId"
          class="rounded-lg bg-gray-800 p-2"
        >
          <div class="mb-1 flex items-center gap-2">
            <img
              v-if="getTraitById(traitId)?.imageUrl"
              :src="getTraitById(traitId)!.imageUrl"
              class="h-5 w-5 shrink-0 object-contain opacity-90"
              alt=""
            />
            <div
              v-else
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-700"
            >
              <svg v-if="getTraitById(traitId)?.type === 'class'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
                <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.71 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.66a6.727 6.727 0 0 0 .551-1.607 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z" />
                <path d="M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2.25a.75.75 0 0 1 .75.75v1.506a49.384 49.384 0 0 1 5.343.371.75.75 0 1 1-.186 1.489c-.66-.083-1.323-.151-1.99-.206a18.67 18.67 0 0 1-2.97 6.323c.318.384.65.753 1 1.107a.75.75 0 0 1-1.07 1.052A18.902 18.902 0 0 1 9 13.687a18.823 18.823 0 0 1-5.656 4.482.75.75 0 0 1-.688-1.333 17.323 17.323 0 0 0 5.396-4.353A18.72 18.72 0 0 1 5.89 8.598a.75.75 0 0 1 1.388-.568A17.21 17.21 0 0 0 9 11.224a17.168 17.168 0 0 0 2.391-5.165 48.04 48.04 0 0 0-8.298.307.75.75 0 0 1-.186-1.489 49.159 49.159 0 0 1 5.343-.371V3a.75.75 0 0 1 .75-.75Zm4.09 2.7a49.4 49.4 0 0 1 4.595.38 49.49 49.49 0 0 1-4.595 6.79A49.48 49.48 0 0 1 8.5 5.33a49.4 49.4 0 0 1 4.59-.38Z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="font-medium text-sm text-gray-200">
              {{ getTraitById(traitId)?.name ?? traitId }}
            </span>
            <span
              v-if="getTraitById(traitId)?.type"
              class="ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="getTraitById(traitId)?.type === 'class' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'"
            >
              {{ getTraitById(traitId)?.type }}
            </span>
          </div>
          <p class="text-xs text-gray-400">
            {{ getTraitById(traitId)?.description ?? "" }}
          </p>
        </div>
      </div>
    </div>
  </ElementBaseModal>
</template>

<script setup lang="ts">
import type { Champion } from "~/types/champion";

defineProps<{
  champion: Champion | null;
  visible: boolean;
}>();

defineEmits<{
  close: [];
}>();

const { getTraitById } = useSynergies();
</script>
