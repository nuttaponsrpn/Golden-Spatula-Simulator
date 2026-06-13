<template>
  <button
    :class="[
      'px-4 py-2 rounded transition-colors font-medium',
      variant === 'primary' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-100',
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>
