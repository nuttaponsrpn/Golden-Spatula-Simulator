<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-100">Meta Compositions</h1>
      <p class="mt-1 text-sm text-gray-400">
        ทีมที่แนะนำสำหรับ TFT Set 14 — กด Load เพื่อโหลดทีมลงบอร์ด
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CompBrowserCompCard
        v-for="comp in suggestedComps"
        :key="comp.id"
        :comp="comp"
        @load="onLoadComp"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SuggestedComp } from "~/types/comp";

useHead({ title: "Comps — Golden Spatula Simulator" });

const { suggestedComps } = useSuggestedComps();
const { loadComp } = useTeamBuilder();
const { champions } = useChampions();

function onLoadComp(comp: SuggestedComp): void {
  loadComp(comp, [...champions.value]);
  navigateTo("/");
}
</script>
