<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4"
        role="dialog"
        :aria-label="title"
        aria-modal="true"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/70" />
        <div
          class="relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-xl bg-gray-900 shadow-2xl"
          data-testid="modal-content"
        >
          <div class="flex shrink-0 items-center justify-between border-b border-gray-800 px-5 py-4">
            <h2 class="text-base font-semibold text-gray-100">{{ title }}</h2>
            <button
              class="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-700 hover:text-gray-100 transition-colors"
              aria-label="Close modal"
              @click="$emit('close')"
            >
              &times;
            </button>
          </div>
          <div class="overflow-y-auto p-5">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  title: string;
}>();

defineEmits<{
  close: [];
}>();
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
