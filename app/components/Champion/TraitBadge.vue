<template>
  <span
    class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-300 bg-gray-700/60 border border-gray-600/40"
  >
    <img
      v-if="iconUrl"
      :src="iconUrl"
      class="h-3 w-3 shrink-0 object-contain opacity-80"
      alt=""
    />
    {{ traitName }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  traitId: string;
  traitName: string;
  iconUrl?: string;
}>();
</script>
