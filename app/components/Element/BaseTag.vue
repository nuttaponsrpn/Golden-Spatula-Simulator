<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      colorClass,
    ]"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  color?: "default" | "bronze" | "silver" | "gold" | "prismatic";
}>();

const colorClass = computed(() => {
  switch (props.color) {
    case "bronze":
      return "bg-amber-900/60 text-tier-bronze border border-tier-bronze/40";
    case "silver":
      return "bg-gray-700/60 text-tier-silver border border-tier-silver/40";
    case "gold":
      return "bg-yellow-900/60 text-tier-gold border border-tier-gold/40";
    case "prismatic":
      return "bg-purple-900/60 text-tier-prismatic border border-tier-prismatic/40";
    default:
      return "bg-gray-700 text-gray-300";
  }
});
</script>
