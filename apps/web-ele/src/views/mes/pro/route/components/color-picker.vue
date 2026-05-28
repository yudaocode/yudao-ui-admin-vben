<script lang="ts" setup>
import { computed } from 'vue';

import { ElColorPicker } from 'element-plus';

/** 甘特图颜色选择器（封装 ElColorPicker，并在右侧展示 hex 文本） */
defineOptions({ name: 'RouteColorPicker' });

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    modelValue?: string;
  }>(),
  {
    disabled: false,
    modelValue: '',
  },
);

const emit = defineEmits<{
  change: [value: string];
  'update:modelValue': [value: string];
}>();

/** 内部 v-model 适配 ElColorPicker，避免对外抛出 null */
const color = computed({
  get: () => props.modelValue || '',
  set: (value: null | string | undefined) => {
    emit('update:modelValue', value ?? '');
    emit('change', value ?? '');
  },
});
</script>

<template>
  <div class="flex items-center gap-2">
    <ElColorPicker v-model="color" :disabled="disabled" />
    <span v-if="color">{{ color }}</span>
  </div>
</template>
