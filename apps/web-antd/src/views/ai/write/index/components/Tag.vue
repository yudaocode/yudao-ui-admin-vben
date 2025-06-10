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
  <div class="flex flex-wrap gap-[8px]">
    <span
      v-for="tag in props.tags"
      :key="tag.value"
      class="tag mb-2 cursor-pointer rounded-[4px] border-[2px] border-solid border-[#DDDFE3] bg-[#DDDFE3] px-2 text-[12px] leading-6"
      :class="modelValue === tag.value && '!border-[#846af7] text-[#846af7]'"
      @click="emits('update:modelValue', tag.value)"
    >
      {{ tag.label }}
    </span>
  </div>
</template>
<style scoped></style>
