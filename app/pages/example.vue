<template>
  <div class="p-8 space-y-8">
    <h1 class="text-2xl font-bold">Example Page</h1>
    
    <div class="space-y-4">
      <p class="text-gray-400">This page demonstrates a Smart component calling an API and handling errors.</p>
      
      <div class="flex gap-4">
        <ElementBaseButton variant="primary" @click="handleFetch">
          Fetch Mock Data
        </ElementBaseButton>
        
        <ElementBaseButton @click="handleError">
          Trigger Error
        </ElementBaseButton>
      </div>
      
      <div v-if="loading" class="text-indigo-400">Loading...</div>
      <pre v-else-if="data" class="bg-gray-800 p-4 rounded">{{ data }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
const { get } = useApi()
const { showError } = useErrorHandler()

const loading = ref(false)
const data = ref<unknown>(null)

async function handleFetch() {
  loading.value = true
  // Mock API call — usually this would be a path from your generated types
  const result = await get<any>('/users/me')
  loading.value = false
  
  if (result.status === 'success') {
    data.value = result.data
  } else {
    showError(result.error)
  }
}

function handleError() {
  showError({
    kind: 'unexpected',
    code: 'MANUAL_ERROR',
    userMessage: 'This is a manually triggered error for demonstration.',
    recoverable: true
  })
}
</script>
