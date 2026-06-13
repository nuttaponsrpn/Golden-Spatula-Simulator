<template>
  <ElementBaseModal :visible="true" title="เลือก Champion ตั้งต้น" @close="$emit('skip')">
    <div class="flex flex-col gap-4 p-4">
      <p class="text-sm text-gray-400">
        เลือก champion ที่ต้องการล็อกไว้ในทีม (ไม่บังคับ) — AI จะจัดทีมโดยมี champion
        เหล่านี้อยู่เสมอ
      </p>

      <!-- Selected champions row -->
      <div v-if="selectedChampions.length > 0" class="flex flex-wrap gap-2">
        <div
          v-for="champ in selectedChampions"
          :key="champ.id"
          class="relative flex items-center gap-1.5 rounded-lg border px-2 py-1"
          :style="{ borderColor: `var(--cost-${champ.cost})` }"
        >
          <img
            :src="champ.imageUrl"
            :alt="champ.name"
            class="h-6 w-6 rounded object-cover"
          />
          <span class="text-xs text-gray-200">{{ champ.name }}</span>
          <button
            class="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
            :aria-label="`ลบ ${champ.name}`"
            @click="toggle(champ.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        </div>
      </div>
      <p v-else class="text-xs text-gray-600 italic">ยังไม่ได้เลือก champion ตั้งต้น</p>

      <ElementBaseInput v-model="searchQuery" placeholder="ค้นหา champion..." />

      <div class="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto sm:grid-cols-7">
        <button
          v-for="champion in filteredChampions"
          :key="champion.id"
          :class="[
            'relative flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all',
            selected.has(champion.id) ? 'bg-gray-700' : 'bg-gray-800',
          ]"
          :style="{ borderColor: `var(--cost-${champion.cost})` }"
          @click="toggle(champion.id)"
        >
          <img
            :src="champion.imageUrl"
            :alt="champion.name"
            class="h-10 w-10 rounded object-cover"
            loading="lazy"
          />
          <span class="text-center text-[10px] leading-tight text-gray-300 line-clamp-1">
            {{ champion.name }}
          </span>

          <span
            v-if="selected.has(champion.id)"
            class="absolute top-0.5 left-1 text-[9px] font-bold text-cost-5"
            >✓</span
          >
        </button>
      </div>

      <div class="flex gap-2 pt-2 border-t border-gray-800">
        <ElementBaseButton variant="primary" @click="confirm">
          {{ selected.size > 0 ? `ยืนยัน ${selected.size} Champion` : "ไม่ใช้ Champion ตั้งต้น" }}
        </ElementBaseButton>
        <ElementBaseButton variant="secondary" @click="$emit('skip')"> ยกเลิก </ElementBaseButton>
      </div>
    </div>
  </ElementBaseModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  initialIds?: string[];
}>();

const emit = defineEmits<{
  select: [championIds: string[]];
  skip: [];
}>();

const { champions } = useTftData();
const searchQuery = ref("");

const filteredChampions = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return champions.value;
  return champions.value.filter((c) => c.name.toLowerCase().includes(q));
});

const selected = ref(new Set<string>(props.initialIds ?? []));

const selectedChampions = computed(() =>
  [...selected.value]
    .map((id) => champions.value.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined),
);

function toggle(id: string): void {
  if (selected.value.has(id)) {
    selected.value.delete(id);
  } else {
    selected.value.add(id);
  }
  selected.value = new Set(selected.value);
}

function confirm(): void {
  emit("select", [...selected.value]);
}
</script>
