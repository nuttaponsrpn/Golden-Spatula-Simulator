<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-950 text-gray-100 p-8">
    <p class="text-6xl">⚠️</p>
    <h1 class="text-2xl font-semibold">{{ title }}</h1>
    <p class="text-gray-400 text-center max-w-sm">{{ description }}</p>
    <div class="flex gap-3">
      <button
        v-if="isRecoverable"
        class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
        @click="handleRetry"
      >
        Try Again
      </button>
      <button
        class="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 transition-colors"
        @click="handleGoHome"
      >
        Go Home
      </button>
    </div>
    <p v-if="isDev" class="text-xs text-gray-600 font-mono">
      {{ error.statusCode }} — {{ error.message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isDev = import.meta.dev

const statusCode = computed(() => props.error.statusCode ?? 500)

const isRecoverable = computed(() => statusCode.value >= 500)

const title = computed(() => {
  if (statusCode.value === 404) return 'Page Not Found'
  if (statusCode.value >= 500) return 'System Error'
  return 'An Error Occurred'
})

const description = computed(() => {
  if (statusCode.value === 404) return 'The page you are looking for does not exist or has been moved.'
  if (statusCode.value >= 500) return 'The system encountered a temporary error. Please try again in a moment.'
  return 'Please try again later.'
})

const handleRetry = () => clearError()
const handleGoHome = () => clearError({ redirect: '/' })
</script>
