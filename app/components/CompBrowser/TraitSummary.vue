<template>
  <div class="flex flex-wrap gap-1">
    <span
      v-for="traitId in keyTraits"
      :key="traitId"
      class="rounded-full bg-indigo-900/60 px-2 py-0.5 text-xs text-indigo-300 border border-indigo-700/40"
    >
      {{ getTraitById(traitId)?.name ?? traitId }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  keyTraits: string[];
}>();

const { getTraitById } = useSynergies();
</script>
