<template>
  <div
    ref="listRef"
    class="flex flex-col gap-4 overflow-y-auto p-4"
    data-testid="chat-message-list"
  >
    <ChatMessageBubble
      v-for="msg in completedMessages"
      :key="msg.id"
      :message="msg"
    />

    <div v-if="streamingMessage !== null" class="flex flex-row gap-3">
      <div
        class="max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-800 px-4 py-3 text-sm leading-relaxed text-gray-100 whitespace-pre-wrap break-words"
      >
        <span v-if="!streamingMessage">
          <span class="inline-flex gap-1 items-center text-gray-400">
            <span class="animate-bounce" style="animation-delay: 0ms">●</span>
            <span class="animate-bounce" style="animation-delay: 150ms">●</span>
            <span class="animate-bounce" style="animation-delay: 300ms">●</span>
          </span>
        </span>
        <span v-else>{{ streamingMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from "~/types/chat";

const props = defineProps<{
  messages: ChatMessage[];
  streamingMessage: string | null;
}>();

const completedMessages = computed(() =>
  props.messages.filter((m) => m.status !== "streaming"),
);

const listRef = ref<HTMLElement | null>(null);

function scrollToBottom(): void {
  if (!listRef.value) return;
  listRef.value.scrollTop = listRef.value.scrollHeight;
}

watch(
  () => [props.messages.length, props.streamingMessage],
  () => nextTick(scrollToBottom),
);

onMounted(() => nextTick(scrollToBottom));
</script>
