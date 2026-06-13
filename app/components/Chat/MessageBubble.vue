<template>
  <div
    :class="[
      'flex gap-3',
      message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
    ]"
    data-testid="chat-message-bubble"
  >
    <div
      :class="[
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words message-content',
        message.role === 'user'
          ? 'bg-cost-5 text-gray-950 rounded-tr-sm'
          : 'bg-gray-800 text-gray-100 rounded-tl-sm',
      ]"
    >
      <div v-if="message.status === 'streaming' && !message.displayContent">
        <span class="inline-flex gap-1 items-center text-gray-400">
          <span class="animate-bounce" style="animation-delay: 0ms">●</span>
          <span class="animate-bounce" style="animation-delay: 150ms">●</span>
          <span class="animate-bounce" style="animation-delay: 300ms">●</span>
        </span>
      </div>
      <div v-else>
        <span v-html="formattedContent"></span>

        <div
          v-if="compChampions.length > 0"
          class="mt-4 pt-4 border-t border-gray-700"
        >
          <p class="text-xs font-semibold text-gray-400 mb-2">ฮีโร่ในทีม</p>
          <div class="flex flex-wrap gap-1.5">
            <div
              v-for="champ in compChampions"
              :key="champ.unitId"
              class="relative flex flex-col items-center gap-0.5"
              :title="champ.name"
            >
              <div
                :class="[
                  'w-10 h-10 rounded-full overflow-hidden border-2',
                  costBorderClass(champ.cost),
                ]"
              >
                <img
                  v-if="champ.imageUrl"
                  :src="champ.imageUrl"
                  :alt="champ.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300 bg-gray-700"
                >
                  {{ champ.name[0] }}
                </div>
              </div>
              <span class="text-[10px] text-gray-400 leading-none max-w-10 text-center truncate">
                {{ champ.name }}
              </span>
            </div>
          </div>
        </div>

        <details v-if="message.boardSnapshot && message.boardSnapshot.length > 0" class="mt-4 pt-4 border-t border-gray-700">
          <summary class="cursor-pointer text-xs font-semibold text-gray-400 hover:text-gray-300 transition-colors select-none">
            ดูข้อมูลบอร์ดดิบ (Board Data)
          </summary>
          <div class="mt-2 bg-gray-900 rounded-md p-3 overflow-x-auto">
            <pre class="text-xs text-gray-300 font-mono whitespace-pre">{{ JSON.stringify(message.boardSnapshot, null, 2) }}</pre>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ChatMessage } from "~/types/chat";
import type { ChampionCost } from "~/types/champion";
import { formatMarkdown } from "~/utils/markdown-client";

const props = defineProps<{
  message: ChatMessage;
}>();

const { getChampionById } = useChampions();

const formattedContent = computed(() => {
  return formatMarkdown(props.message.displayContent);
});

const compChampions = computed(() => {
  if (!props.message.boardSnapshot) return [];
  return props.message.boardSnapshot.map((unit) => {
    const champ = getChampionById(unit.championId);
    return {
      unitId: unit.id,
      name: champ?.name ?? unit.championId,
      imageUrl: champ?.imageUrl ?? "",
      cost: champ?.cost ?? (1 as ChampionCost),
    };
  });
});

const costBorderClass = (cost: ChampionCost): string => {
  const map: Record<ChampionCost, string> = {
    1: "border-gray-400",
    2: "border-green-400",
    3: "border-blue-400",
    4: "border-purple-400",
    5: "border-yellow-400",
  };
  return map[cost];
};
</script>

<style scoped>
/* Add some spacing and styling for markdown elements inside the bubble */
:deep(.message-content strong) {
  font-weight: 600;
  color: inherit;
}
:deep(.message-content em) {
  font-style: italic;
}
:deep(.message-content ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
:deep(.message-content li) {
  margin-bottom: 0.25rem;
}
</style>
