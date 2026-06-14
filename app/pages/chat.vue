<template>
  <div class="flex h-full overflow-hidden lg:flex-row flex-col -mx-4">
    <!-- Session Sidebar (desktop only) -->
    <aside class="hidden lg:flex flex-col w-64 border-r border-gray-800 shrink-0 overflow-hidden">
      <ChatSessionSidebar
        :sessions="savedSessions"
        :active-session-id="activeSessionId"
        @select="switchSession"
        @new="startNewSession"
        @delete="onDeleteSession"
      />
    </aside>

    <!-- Chat area -->
    <div class="flex flex-col flex-1 min-w-0 min-h-0">
      <!-- Header -->
      <div class="flex items-center gap-3 px-4 py-2 border-b border-gray-800 shrink-0">
        <!-- Mobile: hamburger -->
        <button
          class="lg:hidden flex items-center gap-1 rounded-lg bg-gray-700 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-600 transition-colors"
          @click="showMobileSessions = !showMobileSessions"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="w-3.5 h-3.5"
          >
            <path
              fill-rule="evenodd"
              d="M2 3.75A.75.75 0 0 1 2.75 3h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75Zm0 4A.75.75 0 0 1 2.75 7h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 7.75Zm0 4a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        <ChatProviderConfig />

        <ChatVersionSelector
          :has-active-session="!!activeSessionId"
          @version-change="onVersionChange"
        />

        <!-- Anchor badges / picker -->
        <button
          class="flex items-center gap-1 rounded-lg border px-2 py-1 transition-colors"
          :class="
            anchorChampions.length > 0
              ? 'bg-gray-800 border-gray-700 hover:border-gray-500'
              : 'bg-gray-800 border-dashed border-gray-600 hover:border-gray-400'
          "
          :title="
            anchorChampions.length > 0 ? 'เปลี่ยน Champion ตั้งต้น' : 'เลือก Champion ตั้งต้น'
          "
          @click="
            anchorSelectorIsNewSession = false;
            showAnchorSelector = true;
          "
        >
          <template v-if="anchorChampions.length > 0">
            <img
              v-for="champ in anchorChampions"
              :key="champ.id"
              :src="champ.imageUrl"
              :alt="champ.name"
              class="h-5 w-5 rounded object-cover"
            />
            <span class="text-xs text-gray-300 ml-1">
              {{
                anchorChampions.length === 1
                  ? anchorChampions[0]?.name
                  : `${anchorChampions.length} ตัว`
              }}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="w-3 h-3 text-gray-500 ml-0.5"
            >
              <path
                d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474ZM4.75 13.5c-.69 0-1.25-.56-1.25-1.25V4.75c0-.69.56-1.25 1.25-1.25H8a.75.75 0 0 0 0-1.5H4.75A2.75 2.75 0 0 0 2 4.75v7.5A2.75 2.75 0 0 0 4.75 15h7.5A2.75 2.75 0 0 0 15 12.25V9a.75.75 0 0 0-1.5 0v3.25c0 .69-.56 1.25-1.25 1.25h-7.5Z"
              />
            </svg>
          </template>
          <template v-else>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="w-3.5 h-3.5 text-gray-400"
            >
              <path
                d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z"
              />
            </svg>
            <span class="text-xs text-gray-400">Champion ตั้งต้น</span>
          </template>
        </button>

        <div class="flex-1" />

        <!-- Mobile: preview board button -->
        <button
          v-if="previewUnits"
          class="lg:hidden flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-600 transition-colors"
          @click="showMobilePreview = true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="w-3.5 h-3.5"
          >
            <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
            <path
              fill-rule="evenodd"
              d="M1.38 8.28a.87.87 0 0 1 0-.566 7.003 7.003 0 0 1 13.239.006.87.87 0 0 1 0 .566A7.003 7.003 0 0 1 1.379 8.28ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              clip-rule="evenodd"
            />
          </svg>
          ดูทีม
        </button>
      </div>

      <!-- Mobile sessions drawer -->
      <div
        v-if="showMobileSessions"
        class="lg:hidden border-b border-gray-800 max-h-64 overflow-y-auto shrink-0 bg-gray-900"
      >
        <ChatSessionSidebar
          :sessions="savedSessions"
          :active-session-id="activeSessionId"
          @select="
            (id) => {
              switchSession(id);
              showMobileSessions = false;
            }
          "
          @new="
            () => {
              startNewSession();
              showMobileSessions = false;
            }
          "
          @delete="onDeleteSession"
        />
      </div>

      <!-- Message list -->
      <ChatMessageList
        class="flex-1 min-h-0"
        :messages="messages"
        :streaming-message="isStreaming ? streamingContent : null"
        :streaming-tool-calls="streamingToolCalls"
        :streaming-stage="streamingStage"
      />

      <!-- Composer -->
      <div class="border-t border-gray-800 px-4 py-3 shrink-0 pb-0">
        <ChatComposerInput :disabled="isStreaming || !activeSessionId" @submit="onSubmit" />
      </div>
    </div>

    <!-- Board preview panel (desktop) -->
    <aside
      v-if="previewUnits"
      class="hidden lg:flex flex-col w-80 xl:w-96 border-l border-gray-800 shrink-0 min-h-0"
    >
      <ChatBoardPreviewPanel
        :units="previewUnits"
        :visible="true"
        :revisions="revisions"
        :selected-revision-id="selectedRevisionId"
        @load="onLoadToBoard"
        @revision-change="onRevisionChange"
      />
    </aside>
  </div>

  <!-- Anchor selector modal -->
  <ChatAnchorSelector
    v-if="showAnchorSelector"
    :initial-ids="anchorChampionIds"
    @select="onAnchorSelected"
    @skip="onAnchorSkipped"
  />

  <!-- Board preview modal (mobile) -->
  <ChatBoardPreviewModal
    :units="previewUnits"
    :visible="showMobilePreview"
    @close="showMobilePreview = false"
    @load="onLoadToBoard"
  />
</template>

<script setup lang="ts">
import type { PlacedUnits } from "~/types/team";
import type { ChatSession } from "~/types/chat";

definePageMeta({ ssr: false });
useHead({ title: "Chat — Golden Spatula Simulator" });

const route = useRoute();
const {
  champions,
  items,
  init,
  activeMode: gsActiveMode,
  activeVersionInfo: gsActiveVersionInfo,
} = useGsData();
const { loadUnits } = useTeamBuilder();
const { sessions, loadSessions, createSession, updateSession, deleteSession } = useChatSessions();
const { showError } = useErrorHandler();
const aiProvider = useAiProvider();
const promptBuilder = useChatPromptBuilder();

const activeSessionId = ref<string | null>(null);
const anchorChampionIds = ref<string[]>([]);
const previewUnits = ref<PlacedUnits | null>(null);
const selectedRevisionId = ref<string | null>(null);

// pendingSession holds a new session that has not been saved to IndexedDB yet
// (before the user sends their first message)
const pendingSession = ref<ChatSession | null>(null);

const showAnchorSelector = ref(false);
const anchorSelectorIsNewSession = ref(false);
const showMobilePreview = ref(false);
const showMobileSessions = ref(false);

// Sessions shown in the sidebar — only persisted ones, not pending
const savedSessions = computed(() => sessions.value);

const anchorChampions = computed(() =>
  anchorChampionIds.value
    .map((id) => champions.value.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined),
);

type Composer = ReturnType<typeof useChatComposer>;
const composer = ref<Composer | null>(null);

const messages = computed(() => composer.value?.messages ?? []);
const isStreaming = computed(() => composer.value?.isStreaming ?? false);
const streamingContent = computed(() => composer.value?.streamingContent ?? "");
const streamingToolCalls = computed(
  () => composer.value?.streamingToolCalls ?? ([] as import("~/types/chat").ToolCallStep[]),
);
const streamingStage = computed(() => composer.value?.streamingStage ?? null);

const revisions = computed(() =>
  messages.value.filter(
    (m) => m.role === "assistant" && m.boardSnapshot && m.boardSnapshot.length > 0,
  ),
);

watch(
  activeSessionId,
  (sessionId) => {
    composer.value?.cancelStreaming();
    previewUnits.value = null;
    if (!sessionId) {
      composer.value = null;
      return;
    }
    composer.value = useChatComposer({
      sessionId,
      anchorChampionIds: anchorChampionIds.value,
      champions: champions.value,
      items: items.value,
      deps: {
        aiProvider,
        allChampions: champions,
        updateSession,
        activeMode: gsActiveMode,
        activeVersionInfo: gsActiveVersionInfo,
      },
    });
  },
  { immediate: false },
);

// Restore board preview from the last message that has a boardSnapshot
watch(
  messages,
  (msgs) => {
    if (previewUnits.value !== null || isStreaming.value) return;
    const lastWithBoard = [...msgs]
      .reverse()
      .find((m) => m.boardSnapshot && m.boardSnapshot.length > 0);
    if (lastWithBoard?.boardSnapshot) {
      previewUnits.value = lastWithBoard.boardSnapshot;
      selectedRevisionId.value = lastWithBoard.id;
      if (window.innerWidth < 1024) {
        showMobilePreview.value = true;
      }
    }
  },
  { deep: false },
);

// When game mode changes (e.g. from the layout header selector), start a new session
// so the composer uses data for the correct version
watch(gsActiveMode, (newMode, oldMode) => {
  if (oldMode !== undefined && newMode !== oldMode) {
    startNewSession();
  }
});

// Sync URL when active session changes
watch(activeSessionId, (id) => {
  const query = id ? { id } : {};
  void navigateTo({ query }, { replace: true });
});

onMounted(async () => {
  await init();
  await loadSessions();

  // Honour ?id= query param — open that session directly if it exists
  const queryId = route.query["id"];
  const requestedId = typeof queryId === "string" ? queryId : null;

  if (requestedId) {
    const found = sessions.value.find((s) => s.id === requestedId);
    if (found) {
      switchSession(found.id);
      return;
    }
  }

  // Always start a new session if no specific ID requested (instead of loading the latest one)
  startNewSession();
});

function startNewSession(): void {
  // Discard any previous pending session that had no messages
  pendingSession.value = null;
  anchorChampionIds.value = [];
  anchorSelectorIsNewSession.value = true;
  showAnchorSelector.value = true;
}

async function switchSession(id: string): Promise<void> {
  // Discard pending unsaved session if user switches away before sending anything
  pendingSession.value = null;
  previewUnits.value = null;
  const session = sessions.value.find((s) => s.id === id);
  // Guard against sessions persisted before anchorChampionIds was added to the schema
  anchorChampionIds.value = Array.isArray(session?.anchorChampionIds)
    ? session.anchorChampionIds
    : [];

  // Restore game mode for this session — re-init data if mode changed
  const sessionMode = session?.gameMode ?? "17";
  if (sessionMode !== gsActiveMode.value) {
    const result = await init(sessionMode);
    if (result.status === "error" && result.error) showError(result.error);
  }

  activeSessionId.value = id;
}

async function onAnchorSelected(championIds: string[]): Promise<void> {
  showAnchorSelector.value = false;
  const isNew = anchorSelectorIsNewSession.value;
  anchorSelectorIsNewSession.value = false;

  if (isNew) {
    anchorChampionIds.value = championIds;
    await prepareNewSession(championIds);
    return;
  }

  // Editing anchor on an existing session — update in-place
  anchorChampionIds.value = championIds;
  if (activeSessionId.value && !pendingSession.value) {
    const result = await updateSession(activeSessionId.value, { anchorChampionIds: championIds });
    if (result.status === "error") showError(result.error);
  } else if (pendingSession.value) {
    pendingSession.value = { ...pendingSession.value, anchorChampionIds: championIds };
  }
}

function onAnchorSkipped(): void {
  const wasNew = anchorSelectorIsNewSession.value;
  showAnchorSelector.value = false;
  anchorSelectorIsNewSession.value = false;

  // If this was a new-session flow and user cancelled, create session with no anchors
  if (wasNew) {
    void prepareNewSession([]);
  }
}

// Create a pending session (not saved yet) and set it as active so the composer works
async function prepareNewSession(anchorIds: string[]): Promise<void> {
  const now = Date.now();
  const session: ChatSession = {
    id: crypto.randomUUID(),
    title: "การสนทนาใหม่",
    anchorChampionIds: anchorIds,
    gameMode: gsActiveMode.value,
    createdAt: now,
    updatedAt: now,
  };
  pendingSession.value = session;
  anchorChampionIds.value = anchorIds;
  activeSessionId.value = session.id;
  previewUnits.value = null;
}

async function onSubmit(text: string): Promise<void> {
  if (!composer.value || !activeSessionId.value) return;

  // Persist the session on the very first message
  if (pendingSession.value && pendingSession.value.id === activeSessionId.value) {
    const result = await createSession(toRaw(pendingSession.value));
    if (result.status === "error") {
      showError(result.error);
      return;
    }
    pendingSession.value = null;
  }

  const result = await composer.value.sendMessage(text);
  if (result.status === "error") {
    showError(result.error);
    return;
  }
  if (result.boardData && result.boardData.length > 0 && result.messageId) {
    previewUnits.value = result.boardData;
    selectedRevisionId.value = result.messageId;
    if (window.innerWidth < 1024) {
      showMobilePreview.value = true;
    }
  }
}

async function onDeleteSession(sessionId: string): Promise<void> {
  const result = await deleteSession(sessionId);
  if (result.status === "error") {
    showError(result.error);
    return;
  }

  // If deleting the active session, switch to the next available one
  if (activeSessionId.value === sessionId) {
    pendingSession.value = null;
    const next = sessions.value.find((s) => s.id !== sessionId);
    if (next) {
      switchSession(next.id);
    } else {
      activeSessionId.value = null;
      composer.value = null;
      startNewSession();
    }
  }
}

function onRevisionChange(messageId: string): void {
  const msg = messages.value.find((m) => m.id === messageId);
  if (msg?.boardSnapshot) {
    selectedRevisionId.value = messageId;
    previewUnits.value = msg.boardSnapshot;
  }
}

function onLoadToBoard(): void {
  if (!previewUnits.value) return;
  loadUnits(previewUnits.value);
  navigateTo("/builder");
}

async function onVersionChange(mode: string): Promise<void> {
  const result = await init(mode);
  if (result.status === "error" && result.error) {
    showError(result.error);
    return;
  }
  startNewSession();
}

onUnmounted(() => {
  composer.value?.cancelStreaming();
});
</script>
