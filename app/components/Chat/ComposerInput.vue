<template>
  <div class="flex items-end gap-2">
    <textarea
      ref="textareaRef"
      v-model="text"
      :disabled="disabled"
      :class="[
        'flex-1 resize-none rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 outline-none transition-colors',
        'min-h-[44px] max-h-40',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600 focus:border-gray-500',
      ]"
      :placeholder="placeholder"
      rows="1"
      data-testid="chat-composer"
      @keydown="onKeydown"
      @input="autoResize"
    />
    <button
      :disabled="disabled || !text.trim()"
      :class="[
        'shrink-0 flex items-center justify-center rounded-xl bg-cost-5 p-3 text-gray-950 transition-opacity',
        'min-h-[44px] min-w-[44px]',
        disabled || !text.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90',
      ]"
      aria-label="ส่งข้อความ"
      data-testid="chat-send-button"
      @click="submit"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  disabled: boolean;
}>();

const emit = defineEmits<{
  submit: [text: string];
}>();

const text = ref("");

const isMobile = ref(false);
onMounted(() => {
  const mq = window.matchMedia("(max-width: 639px)");
  isMobile.value = mq.matches;
  mq.addEventListener("change", (e) => { isMobile.value = e.matches; });
});
const placeholder = computed(() =>
  isMobile.value ? "พิมพ์ข้อความ..." : "พิมพ์ข้อความ... (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function autoResize(): void {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    submit();
  }
}

function submit(): void {
  const trimmed = text.value.trim();
  if (!trimmed || props.disabled) return;
  emit("submit", trimmed);
  text.value = "";
  nextTick(() => {
    autoResize();
  });
}
</script>
