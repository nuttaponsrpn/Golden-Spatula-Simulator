<template>
  <div class="flex items-center gap-2">
    <button
      class="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-600 transition-colors"
      data-testid="chat-provider-config-button"
      @click="open = true"
    >
      <span
        :class="[
          'h-2 w-2 rounded-full',
          config ? 'bg-green-400' : 'bg-gray-500',
        ]"
      />
      {{ config ? providerLabel : 'ตั้งค่า AI' }}
    </button>

    <ElementBaseModal :visible="open" title="ตั้งค่า AI Provider" @close="open = false">
      <div class="flex flex-col gap-4 p-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-gray-400">Provider</label>
          <ElementBaseSelect
            :model-value="draft.kind"
            :options="providerOptions"
            aria-label="เลือก AI Provider"
            @update:model-value="draft.kind = $event as AiProviderKind"
          />
        </div>

        <div
          v-if="draft.kind === 'gemini-default'"
          class="rounded-lg border border-blue-800 bg-blue-950/40 px-3 py-2 text-xs text-blue-300"
        >
          ใช้ Gemini API key จาก environment ของโปรเจค (gemini-2.5-pro)
        </div>

        <div
          v-else-if="draft.kind === 'deepagents'"
          class="rounded-lg border border-blue-800 bg-blue-950/40 px-3 py-2 text-xs text-blue-300"
        >
          ใช้ DeepAgents พร้อม Gemini API key จาก environment (gemini-2.5-pro + tool use)
        </div>

        <div v-if="draft.kind !== 'gemini-default' && draft.kind !== 'deepagents'" class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-gray-400">API Key</label>
          <ElementBaseInput
            v-model="draft.apiKey"
            placeholder="sk-... หรือ AIza..."
            type="password"
          />
        </div>

        <div v-if="draft.kind === 'copilot'" class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-gray-400">
            Base URL (ไม่บังคับ)
          </label>
          <ElementBaseInput
            v-model="draft.baseUrl"
            placeholder="https://api.openai.com/v1"
          />
        </div>

        <div v-if="draft.kind !== 'gemini-default' && draft.kind !== 'deepagents'" class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-gray-400">
            Model (ไม่บังคับ)
          </label>
          <ElementBaseInput
            v-model="draft.model"
            :placeholder="defaultModelHint"
          />
        </div>

        <div class="flex gap-2 pt-2">
          <ElementBaseButton
            variant="primary"
            :disabled="!canSave"
            @click="save"
          >
            บันทึก
          </ElementBaseButton>
          <ElementBaseButton variant="secondary" @click="open = false">
            ยกเลิก
          </ElementBaseButton>
          <ElementBaseButton
            v-if="config"
            variant="secondary"
            class="ml-auto text-red-400 hover:text-red-300"
            @click="remove"
          >
            ลบ
          </ElementBaseButton>
        </div>
      </div>
    </ElementBaseModal>
  </div>
</template>

<script setup lang="ts">
import type { AiProviderKind } from "~/types/ai-provider";

const { config, setConfig, clearConfig, hasDefaultGemini } = useAiProvider();

const open = ref(false);

const defaultKind = computed<AiProviderKind>(() =>
  config.value?.kind ?? (hasDefaultGemini.value ? "gemini-default" : "claude"),
);

const draft = reactive({
  kind: defaultKind.value,
  apiKey: config.value?.apiKey ?? "",
  model: config.value?.model ?? "",
  baseUrl: config.value?.baseUrl ?? "",
});

watch(open, (val) => {
  if (val) {
    draft.kind = defaultKind.value;
    draft.apiKey = config.value?.apiKey ?? "";
    draft.model = config.value?.model ?? "";
    draft.baseUrl = config.value?.baseUrl ?? "";
  }
});

const providerOptions = computed(() => [
  { value: "gemini-default", label: "Gemini — Default (Google)", disabled: !hasDefaultGemini.value },
  { value: "deepagents", label: "DeepAgents + Gemini Default", disabled: !hasDefaultGemini.value },
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "gemini", label: "Gemini (Google)" },
  { value: "copilot", label: "Copilot / OpenAI-compatible" },
]);

const allProviderLabels: Record<AiProviderKind, string> = {
  "gemini-default": "Gemini — Default",
  deepagents: "DeepAgents + Gemini Default",
  claude: "Claude (Anthropic)",
  gemini: "Gemini (Google)",
  copilot: "Copilot / OpenAI-compatible",
};

const providerLabel = computed(() =>
  config.value ? (allProviderLabels[config.value.kind] ?? config.value.kind) : "",
);

const defaultModelHint = computed(() => {
  switch (draft.kind) {
    case "claude":
      return "claude-opus-4-8 (default)";
    case "gemini":
    case "gemini-default":
      return "gemini-2.5-pro (default)";
    case "copilot":
      return "gpt-4o (default)";
    case "deepagents":
      return "";
  }
});

const canSave = computed(() =>
  draft.kind === "gemini-default" || draft.kind === "deepagents" ? true : !!draft.apiKey.trim(),
);

function save(): void {
  const serverSide = draft.kind === "gemini-default" || draft.kind === "deepagents";
  setConfig({
    kind: draft.kind,
    apiKey: serverSide ? "" : draft.apiKey.trim(),
    model: serverSide ? undefined : (draft.model.trim() || undefined),
    baseUrl: draft.baseUrl.trim() || undefined,
  });
  open.value = false;
}

function remove(): void {
  clearConfig();
  open.value = false;
}
</script>
