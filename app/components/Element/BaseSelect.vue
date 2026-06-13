<template>
  <div ref="containerRef" class="relative">
    <button
      type="button"
      class="select-filter flex w-full items-center justify-between gap-2"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-label="ariaLabel"
      @click="toggle"
    >
      <div class="flex items-center gap-1.5 overflow-hidden">
        <img
          v-if="selectedOption?.icon"
          :src="selectedOption.icon"
          class="h-4 w-4 shrink-0 object-contain"
          alt=""
        />
        <span class="truncate">{{ selectedOption?.label || placeholder }}</span>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-3 w-3 shrink-0 text-gray-500 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <Transition name="fade">
      <ul
        v-if="isOpen"
        class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl focus:outline-none"
        role="listbox"
      >
        <li
          v-for="option in options"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-800"
          :class="[
            modelValue === option.value ? 'bg-indigo-900/40 text-indigo-300' : 'text-gray-300'
          ]"
          role="option"
          :aria-selected="modelValue === option.value"
          @click="select(option.value)"
        >
          <img
            v-if="option.icon"
            :src="option.icon"
            class="h-4 w-4 shrink-0 object-contain"
            alt=""
          />
          <span class="truncate">{{ option.label }}</span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

interface Option {
  value: string | number;
  label: string;
  icon?: string;
}

const props = defineProps<{
  modelValue: string | number | null;
  options: Option[];
  placeholder?: string;
  ariaLabel?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null];
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const selectedOption = computed(() => 
  props.options.find(o => o.value === props.modelValue)
);

function toggle() {
  isOpen.value = !isOpen.value;
}

function select(value: string | number | null) {
  emit("update:modelValue", value);
  isOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.select-filter {
  @apply w-full rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-2 text-xs text-gray-100
         focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
         transition-colors cursor-pointer;
  min-height: 36px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
