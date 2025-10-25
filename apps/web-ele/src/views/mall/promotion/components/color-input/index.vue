<script setup lang="ts">
// TODO @AI：改成 El 风格，而不是iel- 风格；
import { computed } from 'vue';

import { PREDEFINE_COLORS } from '@vben/constants';

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
  <el-input v-model="color">
    <template #prepend>
      <el-color-picker v-model="color" :predefine="PREDEFINE_COLORS" />
    </template>
  </el-input>
</template>

<style scoped lang="scss">
:deep(.el-input-group__prepend) {
  padding: 0;
}
</style>
