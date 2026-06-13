<template>
  <div v-if="isDev" class="flex h-screen bg-gray-900 text-white font-sans">
    <!-- Sidebar -->
    <div class="w-72 border-r border-gray-800 flex flex-col">
      <div class="p-4 border-b border-gray-800">
        <h1 class="font-bold text-xl text-blue-400">TFT Simulator</h1>
        <p class="text-xs text-gray-500">Component Explorer</p>
      </div>
      
      <!-- Debug Info -->
      <div v-if="fetchError" class="p-4 bg-red-900/20 text-red-400 text-xs">
        <p class="font-bold">Fetch Error:</p>
        <pre class="whitespace-pre-wrap text-[10px]">{{ fetchError }}</pre>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <div v-if="!components || components.length === 0" class="p-4 text-center text-gray-500 text-xs">
          No components found. 
          <p class="mt-2">Check app/documents/ folder.</p>
        </div>
        
        <button
          v-for="comp in sortedComponents"
          :key="comp.path"
          @click="selectComponent(comp)"
          class="w-full text-left px-3 py-2 rounded transition-all text-sm group"
          :class="selectedComponent?.path === comp.path ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-800 text-gray-400 hover:text-white'"
        >
          <div class="font-medium">{{ comp.name }}</div>
          <div class="text-[10px] uppercase tracking-wider opacity-60">{{ comp.type }}</div>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto bg-gray-950">
      <div v-if="selectedComponent" class="max-w-6xl mx-auto p-8">
        <div class="mb-8 border-b border-gray-800 pb-6">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-4xl font-black">{{ selectedComponent.name }}</h1>
            <span 
              class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
              :class="selectedComponent.type === 'Pure' ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-purple-900/40 text-purple-400 border border-purple-800'"
            >
              {{ selectedComponent.type }}
            </span>
          </div>
          <p class="text-lg text-gray-400 leading-relaxed italic">{{ selectedComponent.description }}</p>
          <div class="flex items-center gap-2 mt-4">
            <code class="text-xs text-gray-600 font-mono">{{ selectedComponent.componentPath }}</code>
            <span class="text-xs text-gray-800">|</span>
            <code class="text-xs text-blue-900 font-mono">Resolved: {{ getComponentName(selectedComponent.componentPath) }}</code>
          </div>
        </div>

        <div class="space-y-16">
          <section v-for="(example, index) in selectedComponent.examples" :key="example.name" class="scroll-mt-8">
            <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
              <span class="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              {{ example.name }}
            </h2>
            
            <div class="flex flex-col xl:flex-row gap-8">
              <!-- Preview -->
              <div class="flex-1 bg-[#1a1c1e] rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
                <div class="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Preview</span>
                  <div class="flex gap-2">
                    <button 
                      v-if="exampleStates[index]?.visible === false || exampleStates[index]?.modelValue === false"
                      @click="resetExample(index)"
                      class="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-800 hover:bg-blue-800 hover:text-white transition-colors"
                    >
                      Re-open / Reset
                    </button>
                    <div class="flex gap-1.5 items-center">
                      <div class="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                      <div class="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                      <div class="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                    </div>
                  </div>
                </div>
                <div class="p-12 flex flex-col items-center justify-center min-h-[300px]">
                  <!-- Resolve component dynamically by string name -->
                  <component 
                    :is="resolveComponent(getComponentName(selectedComponent.componentPath))" 
                    v-if="typeof resolveComponent(getComponentName(selectedComponent.componentPath)) !== 'string'"
                    v-bind="exampleStates[index]"
                    @close="handleEvent(index, 'close')"
                    @update:modelValue="(val: unknown) => handleEvent(index, 'update:modelValue', val)"
                    @select="(val: unknown) => handleEvent(index, 'select', val)"
                  >
                    <!-- Fallback content for slot -->
                    <div v-if="selectedComponent.name.includes('Modal')" class="text-gray-400 py-10 text-center">
                      <p class="font-bold text-white mb-2">Modal Content Preview</p>
                      <p class="text-sm">This is a placeholder for the default slot.</p>
                      <button @click="handleEvent(index, 'close')" class="mt-4 px-4 py-2 bg-gray-800 rounded text-sm hover:bg-gray-700">
                        Manual Close
                      </button>
                    </div>
                  </component>
                  <div v-else class="text-center p-6 bg-red-900/10 border border-red-900/30 rounded-lg max-w-md">
                    <p class="text-red-400 font-bold mb-2">Resolution Failed</p>
                    <p class="text-xs text-gray-400 mb-4">
                      Nuxt cannot find a component named <code class="text-red-300">{{ getComponentName(selectedComponent.componentPath) }}</code>
                    </p>
                    <div class="text-[10px] text-left bg-black/40 p-3 rounded font-mono text-gray-500">
                      <p>Path: {{ selectedComponent.componentPath }}</p>
                      <p>Expected name: {{ getComponentName(selectedComponent.componentPath) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Details / Editor -->
              <div class="w-full xl:w-[400px] flex flex-col gap-4">
                <!-- Interactive Prop Editor -->
                <div class="flex-1 bg-black rounded-xl border border-gray-800 overflow-hidden flex flex-col">
                  <div class="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Prop Editor</span>
                    <span class="text-[10px] text-gray-600 font-mono">Real-time</span>
                  </div>
                  
                  <div class="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                    <div v-for="(val, key) in exampleStates[index]" :key="key" class="space-y-1">
                      <div class="flex items-center justify-between">
                        <label :for="`prop-${index}-${key}`" class="text-xs font-mono text-gray-400">{{ key }}</label>
                        <span class="text-[9px] text-gray-600 font-mono italic">{{ typeof val === 'object' ? (Array.isArray(val) ? 'array' : 'object') : typeof val }}</span>
                      </div>

                      <!-- Boolean Editor -->
                      <div v-if="typeof val === 'boolean'" class="flex items-center">
                        <button 
                          @click="exampleStates[index][key] = !val"
                          class="relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-black"
                          :class="val ? 'bg-blue-600' : 'bg-gray-700'"
                        >
                          <span 
                            class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" 
                            :class="val ? 'translate-x-5.5' : 'translate-x-1'"
                          />
                        </button>
                        <span class="ml-2 text-xs text-gray-300">{{ val }}</span>
                      </div>

                      <!-- Number Editor -->
                      <input 
                        v-else-if="typeof val === 'number'"
                        :id="`prop-${index}-${key}`"
                        type="number" 
                        v-model.number="exampleStates[index][key]"
                        class="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-xs text-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                      />

                      <!-- Object/Array Editor -->
                      <textarea
                        v-else-if="typeof val === 'object' && val !== null"
                        :id="`prop-${index}-${key}`"
                        :value="JSON.stringify(val, null, 2)"
                        @input="(e) => updateJsonObject(index, key, (e.target as HTMLTextAreaElement).value)"
                        rows="4"
                        class="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-xs text-yellow-500 font-mono focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                      ></textarea>

                      <!-- Function (Read only) -->
                      <div v-else-if="typeof val === 'function'" class="p-2 bg-gray-900/50 rounded border border-gray-800/50 text-[10px] text-gray-600 italic font-mono">
                        (function) => [Native Code]
                      </div>

                      <!-- Default/String Editor -->
                      <input 
                        v-else
                        :id="`prop-${index}-${key}`"
                        type="text" 
                        v-model="exampleStates[index][key]"
                        class="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-xs text-green-400 focus:outline-none focus:border-green-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
                
                <div class="h-48 bg-black rounded-xl border border-gray-800 overflow-hidden flex flex-col">
                  <div class="px-4 py-2 bg-gray-900 border-b border-gray-800">
                    <span class="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Original Usage</span>
                  </div>
                  <pre class="flex-1 p-4 text-xs text-gray-500 font-mono overflow-auto opacity-50">{{ example.usage }}</pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div v-else class="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
        <div class="w-16 h-16 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center">
          <svg class="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </div>
        <div class="text-center">
          <p class="text-sm font-medium">No component selected</p>
          <p class="text-xs">Select a component from the sidebar to preview</p>
          <p v-if="components && components.length > 0" class="text-[10px] mt-4 text-gray-800">
            Total components found: {{ components.length }}
          </p>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="h-screen flex items-center justify-center bg-gray-950 text-white font-sans">
    <div class="text-center">
      <h1 class="text-6xl font-black text-gray-900 mb-4">404</h1>
      <p class="text-gray-500">Explorer is only available in <span class="text-blue-500 font-bold">development</span> mode.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import type { ComponentMetadata } from '~/types/dev';

const isDev = import.meta.dev;
const { data: components, error: fetchError } = await useFetch<ComponentMetadata[]>('/api/dev/components');

const selectedComponent = ref<ComponentMetadata | null>(null);
const exampleStates = reactive<Record<number, any>>({});

const sortedComponents = computed(() => {
  if (!components.value) return [];
  return [...components.value].sort((a, b) => a.name.localeCompare(b.name));
});

function selectComponent(comp: ComponentMetadata) {
  selectedComponent.value = comp;
  // Initialize states for each example
  comp.examples.forEach((example, index) => {
    const state = JSON.parse(JSON.stringify(example.props));
    
    // Auto-mock functions if needed (since JSON can't hold them)
    // For ChampionPicker and similar components
    if (comp.name.includes('Picker') || comp.name.includes('Champion')) {
      if (!state.isChampionOnBoard) state.isChampionOnBoard = () => false;
      if (!state.isItemOnBoard) state.isItemOnBoard = () => false;
    }
    
    exampleStates[index] = state;
  });
}

function resetExample(index: number) {
  if (selectedComponent.value) {
    exampleStates[index] = JSON.parse(JSON.stringify(selectedComponent.value.examples[index]?.props));
  }
}

function handleEvent(index: number, event: string, payload?: any) {
  console.log(`[Dev Explorer] Event fired: ${event}`, payload);
  const state = exampleStates[index];
  
  if (event === 'close') {
    if ('visible' in state) state.visible = false;
    if ('modelValue' in state) state.modelValue = false;
  } else if (event === 'update:modelValue') {
    state.modelValue = payload;
  }
}

function updateJsonObject(index: number, key: string | number, value: string) {
  try {
    exampleStates[index][key] = JSON.parse(value);
  } catch (e) {
    // Silently wait for valid JSON
  }
}

function getComponentName(componentPath: string) {
  const normalizedPath = componentPath.replace(/\\/g, '/');
  const path = normalizedPath.replace('app/components/', '').replace('.vue', '');
  return path.split('/').join('');
}
</script>

<style>
/* Reset some default Nuxt stuff if needed */
body {
  margin: 0;
  padding: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
