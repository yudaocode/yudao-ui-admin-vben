<script lang="ts" setup>
import { ElInputNumber } from 'element-plus';

defineOptions({ name: 'FmsInitialBalanceAmountInput' });

withDefaults(
  defineProps<{
    modelValue?: number;
    precision?: number;
  }>(),
  {
    modelValue: 0,
    precision: 2,
  },
);

const emit = defineEmits<{
  change: [];
  'update:modelValue': [value: number];
}>();

/** 提交变化时更新绑定值并触发汇总 */
function handleChange(value: number | undefined) {
  emit('update:modelValue', value || 0);
  emit('change');
}
</script>

<template>
  <ElInputNumber
    :controls="false"
    :min="0"
    :precision="precision"
    :model-value="modelValue"
    class="amount-input"
    @change="handleChange"
  />
</template>

<style scoped>
.amount-input {
  width: 118px;
}

.amount-input :deep(.el-input__inner) {
  text-align: right;
}
</style>
