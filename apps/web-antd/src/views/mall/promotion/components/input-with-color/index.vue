<script lang="ts" setup>
import { PREDEFINE_COLORS } from '@vben/constants';

import { useVModels } from '@vueuse/core';

/** 带颜色选择器输入框 */
defineOptions({ name: 'InputWithColor' });

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'update:color']);

const { modelValue, color } = useVModels(props, emit);
</script>

<template>
  <InputGroup compact>
    <Input v-model:value="modelValue" v-bind="$attrs" class="flex-1" />
    <ColorPicker v-model:value="color" :presets="PREDEFINE_COLORS" />
  </InputGroup>
</template>
<style scoped lang="scss"></style>
