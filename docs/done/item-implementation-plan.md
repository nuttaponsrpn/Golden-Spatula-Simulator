# Dev Component Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Dev Component Explorer at `/dev/components` that reads component documentation and provides a live preview.

**Architecture:** A server API scans the `app/documents/` directory for `.md` files, parses them for component metadata and examples, and a frontend page displays this list and allows interactive preview of components using their auto-imported names.

**Tech Stack:** Nuxt 4, Vue 3, Tailwind CSS, Node.js `fs`.

---

### Task 1: Server API for Component Metadata

**Files:**
- Create: `server/api/dev/components.get.ts`
- Create: `server/utils/markdown.ts`

- [ ] **Step 1: Create markdown parsing utility**
Create a utility to parse the project's component documentation format.

```ts
// server/utils/markdown.ts
export interface ComponentExample {
  name: string;
  props: Record<string, any>;
  usage: string;
}

export interface ComponentMetadata {
  name: string;
  path: string;
  description: string;
  type: 'Pure' | 'Smart';
  componentPath: string;
  examples: ComponentExample[];
}

export function parseComponentMarkdown(content: string, filePath: string): ComponentMetadata {
  const lines = content.split('\n');
  const name = lines[0]?.replace('# ', '').trim() ?? '';
  
  const descriptionMatch = content.match(/> (.*)/);
  const description = descriptionMatch ? descriptionMatch[1] : '';
  
  const typeMatch = content.match(/\*\*Type:\*\* (Pure|Smart)/);
  const type = (typeMatch ? typeMatch[1] : 'Pure') as 'Pure' | 'Smart';
  
  const componentPathMatch = content.match(/\*\*Component:\*\* `(.*)`/);
  const componentPath = componentPathMatch ? componentPathMatch[1] : '';

  const examples: ComponentExample[] = [];
  const exampleSections = content.split('## Examples')[1]?.split('### ') ?? [];
  
  for (const section of exampleSections) {
    if (!section.trim()) continue;
    const lines = section.split('\n');
    const exampleName = lines[0].trim();
    
    const jsonMatch = section.match(/```json\n([\s\S]*?)\n```/);
    const vueMatch = section.match(/```vue\n([\s\S]*?)\n```/);
    
    if (jsonMatch) {
      try {
        examples.push({
          name: exampleName,
          props: JSON.parse(jsonMatch[1]),
          usage: vueMatch ? vueMatch[1].trim() : ''
        });
      } catch (e) {
        console.error(`Failed to parse JSON in ${filePath}: ${e}`);
      }
    }
  }

  return {
    name,
    path: filePath,
    description,
    type,
    componentPath,
    examples
  };
}
```

- [ ] **Step 2: Create the server API route**
Implement the API that scans `app/documents/` and returns the metadata.

```ts
// server/api/dev/components.get.ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Dev only',
    });
  }

  const docsDir = path.join(process.cwd(), 'app/documents');
  const components: any[] = [];

  async function walk(dir: string) {
    const files = await fs.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const res = path.resolve(dir, file.name);
      if (file.isDirectory()) {
        await walk(res);
      } else if (file.name.endsWith('.md')) {
        const content = await fs.readFile(res, 'utf-8');
        const relativePath = path.relative(docsDir, res);
        components.push(parseComponentMarkdown(content, relativePath));
      }
    }
  }

  await walk(docsDir);
  return components;
});
```

- [ ] **Step 3: Test API**
Run the dev server and check `http://localhost:3000/api/dev/components`.
Expected: A JSON array of component metadata.

- [ ] **Step 4: Commit**

```bash
git add server/api/dev/components.get.ts server/utils/markdown.ts
git commit -m "dev: add server API for component metadata"
```

---

### Task 2: Dev Component Explorer Page

**Files:**
- Create: `app/pages/dev/components.vue`

- [ ] **Step 1: Implement the page structure**
Create the UI with a sidebar for component list and a main area for preview.

```vue
<!-- app/pages/dev/components.vue -->
<template>
  <div v-if="isDev" class="flex h-screen bg-gray-900 text-white">
    <!-- Sidebar -->
    <div class="w-64 border-r border-gray-800 flex flex-col">
      <div class="p-4 border-b border-gray-800 font-bold text-lg">
        Component Explorer
      </div>
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          v-for="comp in components"
          :key="comp.path"
          @click="selectedComponent = comp"
          class="w-full text-left px-3 py-2 rounded transition-colors"
          :class="selectedComponent?.path === comp.path ? 'bg-blue-600' : 'hover:bg-gray-800'"
        >
          <div class="font-medium text-sm">{{ comp.name }}</div>
          <div class="text-xs text-gray-400">{{ comp.type }}</div>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-8">
      <div v-if="selectedComponent">
        <h1 class="text-3xl font-bold mb-2">{{ selectedComponent.name }}</h1>
        <p class="text-gray-400 mb-6 italic">{{ selectedComponent.description }}</p>

        <div class="space-y-12">
          <section v-for="example in selectedComponent.examples" :key="example.name">
            <h2 class="text-xl font-semibold mb-4 border-b border-gray-800 pb-2">
              {{ example.name }}
            </h2>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Preview -->
              <div class="bg-gray-800 rounded-lg p-8 flex items-center justify-center border border-gray-700 min-h-[200px]">
                <component 
                  :is="getComponentName(selectedComponent.componentPath)" 
                  v-bind="example.props"
                >
                  <!-- Basic slot handling if possible, or just default -->
                </component>
              </div>

              <!-- Details -->
              <div class="space-y-4">
                <div>
                  <h3 class="text-xs font-bold uppercase text-gray-500 mb-2">Props (JSON)</h3>
                  <pre class="bg-black p-4 rounded text-xs text-blue-400 overflow-x-auto">{{ JSON.stringify(example.props, null, 2) }}</pre>
                </div>
                <div>
                  <h3 class="text-xs font-bold uppercase text-gray-500 mb-2">Usage</h3>
                  <pre class="bg-black p-4 rounded text-xs text-green-400 overflow-x-auto">{{ example.usage }}</pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div v-else class="h-full flex items-center justify-center text-gray-500 italic">
        Select a component from the sidebar to preview
      </div>
    </div>
  </div>
  <div v-else class="p-8 text-center">
    <h1 class="text-2xl font-bold">404 - Not Found</h1>
    <p>This page is only available in development mode.</p>
  </div>
</template>

<script setup lang="ts">
const isDev = import.meta.dev;
const { data: components } = await useFetch('/api/dev/components');
const selectedComponent = ref(null);

function getComponentName(componentPath: string) {
  // app/components/Element/BaseButton.vue -> ElementBaseButton
  const path = componentPath.replace('app/components/', '').replace('.vue', '');
  return path.split('/').join('');
}
</script>

<style scoped>
/* Any specific styles for the explorer */
</style>
```

- [ ] **Step 2: Add navigation link (Optional but helpful)**
Add a link to the explorer in the main layout or index page when in dev.

- [ ] **Step 3: Verify**
Go to `/dev/components` and check if components are rendered correctly.
Verify that props are applied.

- [ ] **Step 4: Commit**

```bash
git add app/pages/dev/components.vue
git commit -m "dev: add Dev Component Explorer page"
```
