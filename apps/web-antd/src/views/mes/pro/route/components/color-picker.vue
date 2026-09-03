<script lang="ts" setup>
import { computed } from 'vue';

import { ColorPicker } from '#/components/color-picker';

/** 甘特图颜色选择器：复用通用取色器并在右侧展示 hex 文本。 */
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

const color = computed({
  get: () => props.modelValue ?? '',
  set: (value: string) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});
</script>

<template>
  <div class="flex items-center gap-2">
    <ColorPicker
      v-model="color"
      class="route-color-picker__swatch"
      :disabled="disabled"
    />
    <span v-if="color">{{ color }}</span>
  </div>
</template>

<style scoped>
:deep(.route-color-picker__swatch) {
  inline-size: 36px;
  block-size: 28px;
  border-color: var(--ant-color-border, #d9d9d9);
}
</style>
