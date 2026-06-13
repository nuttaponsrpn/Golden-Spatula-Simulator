<template>
  <div class="min-h-screen overflow-x-hidden bg-gray-950 text-gray-100">
    <nav class="border-b border-gray-800 bg-gray-900 px-4 py-3">
      <div class="mx-auto flex max-w-screen-xl items-center justify-between">
        <NuxtLink to="/chat" class="flex items-center gap-2 text-lg font-bold text-cost-5">
          <span>&#9728;</span>
          <span class="hidden sm:inline">Golden Spatula Simulator</span>
          <span class="sm:hidden">GSS</span>
        </NuxtLink>

        <!-- Desktop nav -->
        <div class="hidden sm:flex items-center gap-4 text-sm text-gray-400">
          <NuxtLink to="/chat" class="hover:text-gray-100 transition-colors" active-class="text-gray-100">
            Chat
          </NuxtLink>
          <NuxtLink to="/builder" class="hover:text-gray-100 transition-colors" active-class="text-gray-100">
            Builder
          </NuxtLink>
          <NuxtLink to="/comps" class="hover:text-gray-100 transition-colors" active-class="text-gray-100">
            Comps
          </NuxtLink>
        </div>

        <!-- Mobile hamburger -->
        <button
          class="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          aria-label="Toggle navigation menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-5 h-5">
            <path fill-rule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75Zm0 4A.75.75 0 0 1 2.75 7h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 7.75Zm0 4a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-5 h-5">
            <path d="M2.22 2.22a.75.75 0 0 1 1.06 0L8 6.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L9.06 8l4.72 4.72a.75.75 0 1 1-1.06 1.06L8 9.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L6.94 8 2.22 3.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      </div>

      <!-- Mobile dropdown menu -->
      <div
        v-if="mobileMenuOpen"
        class="sm:hidden mt-3 flex flex-col gap-1 border-t border-gray-800 pt-3"
      >
        <NuxtLink
          to="/chat"
          class="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
          active-class="bg-gray-800 text-gray-100"
          @click="mobileMenuOpen = false"
        >
          Chat
        </NuxtLink>
        <NuxtLink
          to="/builder"
          class="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
          active-class="bg-gray-800 text-gray-100"
          @click="mobileMenuOpen = false"
        >
          Builder
        </NuxtLink>
        <NuxtLink
          to="/comps"
          class="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
          active-class="bg-gray-800 text-gray-100"
          @click="mobileMenuOpen = false"
        >
          Comps
        </NuxtLink>
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
const mobileMenuOpen = ref(false);
const route = useRoute();

watch(() => route.path, () => {
  mobileMenuOpen.value = false;
});
</script>
