<script setup lang="ts">
import { computed } from 'vue';

import { PREDEFINE_COLORS } from '@vben/constants';

import { Input, InputGroup } from 'ant-design-vue';

/** 颜色输入框 */
defineOptions({ name: 'ColorInput' });

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const color = computed({
  get: () => {
    return props.modelValue;
  },
  set: (val: string) => {
    emit('update:modelValue', val);
  },
});
</script>

<template>
  <InputGroup compact>
    <ColorPicker v-model:value="color" :presets="PREDEFINE_COLORS" />
    <Input v-model:value="color" class="flex-1" />
  </InputGroup>
</template>

<style scoped lang="scss"></style>
