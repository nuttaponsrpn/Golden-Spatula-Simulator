<template>
  <div v-if="activations.length > 0" class="mt-3 flex flex-wrap gap-1.5" data-testid="board-synergy-bar">
    <BoardSynergyBadge
      v-for="activation in activations"
      :key="activation.trait.id"
      :activation="activation"
    />
  </div>
</template>

<script setup lang="ts">
import type { SynergyActivation } from "~/types/trait";

defineProps<{
  activations: SynergyActivation[];
}>();
</script>
