<template>
  <div data-testid="suggestion-list">
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
      คำแนะนำ
    </h3>
    <ul v-if="suggestions.length > 0" class="flex flex-col gap-1.5">
      <li
        v-for="(suggestion, i) in suggestions"
        :key="i"
        class="flex items-start gap-2 rounded-lg bg-gray-800 p-2 text-xs text-gray-300"
      >
        <span class="mt-0.5 shrink-0 text-cost-5">&#9654;</span>
        <span>{{ suggestion }}</span>
      </li>
    </ul>
    <p v-else class="text-xs text-gray-500">ไม่มีคำแนะนำ</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  suggestions: string[];
}>();
</script>
