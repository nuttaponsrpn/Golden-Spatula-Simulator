<template>
  <div class="min-h-screen overflow-x-hidden bg-gray-950 text-gray-100">
    <nav class="border-b border-gray-800 bg-gray-900 px-4 py-3">
      <div class="mx-auto flex max-w-screen-xl items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 text-lg font-bold text-cost-5">
          <span>&#9728;</span>
          <span>Golden Spatula Simulator</span>
        </NuxtLink>
        <div class="flex items-center gap-4 text-sm text-gray-400">
          <NuxtLink to="/" class="hover:text-gray-100 transition-colors" active-class="text-gray-100">
            Builder
          </NuxtLink>
          <NuxtLink to="/comps" class="hover:text-gray-100 transition-colors" active-class="text-gray-100">
            Comps
          </NuxtLink>
        </div>
      </div>
    </nav>

    <main class="mx-auto max-w-screen-xl px-4 py-6">
      <slot />
    </main>

    <div
      v-if="globalError"
      class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-red-900 px-4 py-3 shadow-lg"
    >
      <span class="text-sm text-red-100">{{ globalError.userMessage }}</span>
      <button
        class="text-red-300 hover:text-red-100 transition-colors"
        aria-label="Dismiss error"
        @click="clearGlobalError()"
      >
        &times;
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { error: globalError, clearGlobalError } = useGlobalError();
</script>
