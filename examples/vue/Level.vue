<script setup lang="ts">
import "@johnmorrisdotca/suido/element/define";

withDefaults(defineProps<{ grid?: string; level?: number }>(), { grid: "7x7", level: 12 });
</script>

<template>
  <suido-board :grid="grid" :level="level" hints></suido-board>
</template>
