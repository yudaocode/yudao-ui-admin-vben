<script lang="ts" setup>
import { computed } from 'vue';

/** 甘特图颜色选择器（ant-design-vue 4.x 暂未提供 ColorPicker，封装原生 input[type=color]） */
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

/** 用于 input[type=color] 的展示值，必须是合法 hex；非法时回退到 #000000 但不修改 modelValue */
const swatchValue = computed(() =>
  /^#[0-9a-f]{6}$/i.test(props.modelValue ?? '')
    ? (props.modelValue as string)
    : '#000000',
);

/** 颜色变化时同步 modelValue */
function handleColorChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<template>
  <div class="flex items-center gap-2">
    <input
      class="route-color-picker__swatch"
      :disabled="disabled"
      type="color"
      :value="swatchValue"
      @change="handleColorChange"
      @input="handleColorChange"
    />
    <span v-if="modelValue">{{ modelValue }}</span>
  </div>
</template>

<style scoped>
.route-color-picker__swatch {
  block-size: 28px;
  border: 1px solid var(--ant-color-border, #d9d9d9);
  border-radius: 4px;
  cursor: pointer;
  inline-size: 36px;
  padding: 2px;
}

.route-color-picker__swatch:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
