<script lang="ts" setup>
import { InputNumber } from 'ant-design-vue';

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

/** 提交变化时更新绑定值并触发汇总；InputNumber 的值可能是 string，统一收敛为 number */
function handleChange(value: null | number | string | undefined) {
  emit('update:modelValue', Number(value) || 0);
  emit('change');
}
</script>

<template>
  <InputNumber
    :controls="false"
    :min="0"
    :precision="precision"
    :value="modelValue"
    class="amount-input"
    @change="handleChange"
  />
</template>

<style scoped>
.amount-input {
  width: 118px;
}

.amount-input :deep(.ant-input-number-input) {
  text-align: right;
}
</style>
