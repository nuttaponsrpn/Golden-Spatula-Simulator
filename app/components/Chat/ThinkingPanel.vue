<template>
  <details class="mb-3 rounded-lg border border-gray-700 bg-gray-900/50 text-xs">
    <summary
      class="px-3 py-2 cursor-pointer select-none text-gray-400 hover:text-gray-300 flex items-center gap-2 transition-colors"
    >
      <span>▶</span>
      <span>Thinking ({{ steps.length }} step{{ steps.length !== 1 ? "s" : "" }})</span>
      <span
        v-if="isStreaming && steps.some((s) => s.status === 'pending')"
        class="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"
        aria-label="loading"
      />
    </summary>
    <div class="px-3 pb-3 pt-1 space-y-2">
      <div
        v-for="step in steps"
        :key="step.id"
        class="flex items-start gap-2"
      >
        <span class="mt-0.5 shrink-0">
          <span v-if="step.status === 'pending'">⏳</span>
          <span v-else-if="step.status === 'done'" class="text-green-400">✓</span>
          <span v-else class="text-red-400">✗</span>
        </span>
        <div class="min-w-0">
          <span class="font-mono text-gray-300">{{ step.toolName }}</span>
          <span class="text-gray-500 ml-2 break-all">{{ compactJson(step.input) }}</span>
          <div
            v-if="step.resultSummary"
            class="text-gray-500 mt-0.5 leading-relaxed"
          >
            {{ step.resultSummary }}
          </div>
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import type { ToolCallStep } from "~/types/chat";

defineProps<{
  steps: ToolCallStep[];
  isStreaming: boolean;
}>();

function compactJson(input: Record<string, unknown>): string {
  try {
    const str = JSON.stringify(input);
    return str.length > 80 ? str.slice(0, 77) + "…" : str;
  } catch {
    return "{}";
  }
}
</script>
