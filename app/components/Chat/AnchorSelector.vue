<template>
  <ElementBaseModal :visible="true" title="เลือก Champion ตั้งต้น" @close="$emit('skip')">
    <div class="flex flex-col gap-4 p-4">
      <p class="text-sm text-gray-400">
        เลือก champion ที่ต้องการล็อกไว้ในทีม (ไม่บังคับ) — AI จะจัดทีมโดยมี champion เหล่านี้อยู่เสมอ
        <span v-if="selected.size > 0" class="text-white font-medium">({{ selected.size }} ตัว)</span>
      </p>

      <ElementBaseInput
        v-model="searchQuery"
        placeholder="ค้นหา champion..."
      />

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
            :class="[
              'absolute top-1 right-1 text-[9px] font-bold',
              champion.cost === 5 ? 'text-cost-5' :
              champion.cost === 4 ? 'text-cost-4' :
              champion.cost === 3 ? 'text-cost-3' :
              champion.cost === 2 ? 'text-cost-2' : 'text-cost-1',
            ]"
          >{{ champion.cost }}</span>
          <span
            v-if="selected.has(champion.id)"
            class="absolute top-0.5 left-1 text-[9px] font-bold text-cost-5"
          >✓</span>
        </button>
      </div>

      <div class="flex gap-2 pt-2 border-t border-gray-800">
        <ElementBaseButton variant="primary" @click="confirm">
          {{ selected.size > 0 ? `ยืนยัน ${selected.size} Champion` : 'ไม่ใช้ Champion ตั้งต้น' }}
        </ElementBaseButton>
        <ElementBaseButton variant="secondary" @click="$emit('skip')">
          ยกเลิก
        </ElementBaseButton>
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
