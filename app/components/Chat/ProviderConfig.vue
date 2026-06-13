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

        <div class="flex flex-col gap-1.5">
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

        <div class="flex flex-col gap-1.5">
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
            :disabled="!draft.apiKey.trim()"
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

const { config, setConfig, clearConfig } = useAiProvider();

const open = ref(false);

const draft = reactive({
  kind: (config.value?.kind ?? "claude") as AiProviderKind,
  apiKey: config.value?.apiKey ?? "",
  model: config.value?.model ?? "",
  baseUrl: config.value?.baseUrl ?? "",
});

watch(open, (val) => {
  if (val) {
    draft.kind = config.value?.kind ?? "claude";
    draft.apiKey = config.value?.apiKey ?? "";
    draft.model = config.value?.model ?? "";
    draft.baseUrl = config.value?.baseUrl ?? "";
  }
});

const providerOptions = [
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "gemini", label: "Gemini (Google)" },
  { value: "copilot", label: "Copilot / OpenAI-compatible" },
];

const providerLabel = computed(() => {
  const opt = providerOptions.find((o) => o.value === config.value?.kind);
  return opt?.label ?? config.value?.kind ?? "";
});

const defaultModelHint = computed(() => {
  switch (draft.kind) {
    case "claude":
      return "claude-opus-4-5 (default)";
    case "gemini":
      return "gemini-2.0-flash (default)";
    case "copilot":
      return "gpt-4o (default)";
  }
});

function save(): void {
  setConfig({
    kind: draft.kind,
    apiKey: draft.apiKey.trim(),
    model: draft.model.trim() || undefined,
    baseUrl: draft.baseUrl.trim() || undefined,
  });
  open.value = false;
}

function remove(): void {
  clearConfig();
  open.value = false;
}
</script>
