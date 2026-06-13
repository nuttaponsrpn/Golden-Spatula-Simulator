<template>
  <div class="flex flex-col h-full" data-testid="chat-session-sidebar">
    <div class="flex items-center justify-between p-3 border-b border-gray-800 shrink-0">
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">ประวัติการสนทนา</span>
      <button
        class="flex items-center gap-1 rounded-lg bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 transition-colors"
        data-testid="new-chat-button"
        @click="$emit('new')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3">
          <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
        </svg>
        ใหม่
      </button>
    </div>

    <div class="flex-1 overflow-y-auto py-2">
      <div
        v-if="sessions.length === 0"
        class="px-3 py-6 text-center text-xs text-gray-600"
      >
        ยังไม่มีประวัติการสนทนา
      </div>

      <div
        v-for="session in sessions"
        :key="session.id"
        :class="[
          'group relative flex items-center transition-colors',
          activeSessionId === session.id
            ? 'bg-gray-700'
            : 'hover:bg-gray-800',
        ]"
      >
        <button
          :class="[
            'flex-1 text-left px-3 py-2.5 flex flex-col gap-0.5 min-w-0',
            activeSessionId === session.id ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-200',
          ]"
          @click="$emit('select', session.id)"
        >
          <span class="text-xs font-medium truncate pr-6">{{ session.title || 'การสนทนา' }}</span>
          <span class="text-[10px] text-gray-600">
            {{ formatDate(session.updatedAt) }}
          </span>
        </button>

        <!-- Delete button — visible on hover or when session is active -->
        <button
          v-if="confirmingDeleteId !== session.id"
          :class="[
            'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors opacity-0 group-hover:opacity-100',
            activeSessionId === session.id
              ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600'
              : 'text-gray-600 hover:text-red-400 hover:bg-gray-700',
          ]"
          :data-testid="`delete-session-${session.id}`"
          :aria-label="`ลบการสนทนา ${session.title}`"
          @click.stop="confirmingDeleteId = session.id"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3.5 h-3.5">
            <path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Inline confirm buttons — shown after clicking delete -->
        <div
          v-else
          class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1"
          @click.stop
        >
          <button
            class="px-1.5 py-0.5 text-[10px] rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
            :data-testid="`confirm-delete-session-${session.id}`"
            @click.stop="onConfirmDelete(session.id)"
          >
            ลบ
          </button>
          <button
            class="px-1.5 py-0.5 text-[10px] rounded bg-gray-600 hover:bg-gray-500 text-gray-200 transition-colors"
            :data-testid="`cancel-delete-session-${session.id}`"
            @click.stop="confirmingDeleteId = null"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  sessions: { id: string; title: string; updatedAt: number }[];
  activeSessionId: string | null;
}>();

const emit = defineEmits<{
  select: [sessionId: string];
  new: [];
  delete: [sessionId: string];
}>();

const confirmingDeleteId = ref<string | null>(null);

function onConfirmDelete(sessionId: string) {
  confirmingDeleteId.value = null;
  emit('delete', sessionId);
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Suppress unused warning
void props;
</script>
