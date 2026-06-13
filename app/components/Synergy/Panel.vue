<template>
  <div data-testid="synergy-panel">
    <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
      Synergies
    </h2>

    <div v-if="activations.length === 0" class="py-4 text-center text-sm text-gray-500">
      เพิ่มแชมป์เพื่อดู synergy
    </div>

    <div v-else class="flex flex-col gap-1.5">
      <SynergyTraitRow
        v-for="activation in activations"
        :key="activation.trait.id"
        :activation="activation"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SynergyActivation } from "~/types/trait";

defineProps<{
  activations: SynergyActivation[];
}>();
</script>
