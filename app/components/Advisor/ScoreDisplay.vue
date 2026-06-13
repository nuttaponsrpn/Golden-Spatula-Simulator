<template>
  <div class="flex flex-col items-center gap-2" data-testid="score-display">
    <div
      :class="[
        'flex h-20 w-20 items-center justify-center rounded-full border-4 text-3xl font-bold',
        gradeStyle,
      ]"
    >
      {{ score.grade }}
    </div>
    <div class="text-center">
      <div class="text-2xl font-bold text-gray-100">{{ score.total }}</div>
      <div class="text-xs text-gray-400">คะแนนรวม</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CompScore } from "~/types/comp";

const props = defineProps<{
  score: CompScore;
}>();

const gradeStyle = computed(() => {
  switch (props.score.grade) {
    case "S":
      return "border-tier-prismatic text-tier-prismatic";
    case "A":
      return "border-tier-gold text-tier-gold";
    case "B":
      return "border-cost-2 text-cost-2";
    case "C":
      return "border-cost-3 text-cost-3";
    default:
      return "border-gray-600 text-gray-400";
  }
});
</script>
