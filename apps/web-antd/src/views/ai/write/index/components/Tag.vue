<!-- 标签选项 -->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    [k: string]: any;
    modelValue: string;
    tags: { label: string; value: string }[];
  }>(),
  {
    tags: () => [],
  },
);

const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="tag in props.tags"
      :key="tag.value"
      class="mb-2 cursor-pointer rounded border-2 border-solid border-gray-200 bg-gray-200 px-1 text-xs leading-6"
      :class="modelValue === tag.value && '!border-purple-500 !text-purple-500'"
      @click="emits('update:modelValue', tag.value)"
    >
      {{ tag.label }}
    </span>
  </div>
</template>
