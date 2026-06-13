<template>
  <div class="relative">
    <div
      v-if="$slots.icon"
      class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    >
      <slot name="icon" />
    </div>
    <input
      :value="modelValue"
      :placeholder="placeholder"
      :class="[
        'w-full rounded-lg bg-gray-800 text-gray-100 placeholder-gray-500',
        'border border-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
        'py-2 text-sm transition-colors',
        $slots.icon ? 'pl-9 pr-3' : 'px-3',
      ]"
      :aria-label="label ?? placeholder"
      data-testid="base-input"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
  label?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
}
</script>
