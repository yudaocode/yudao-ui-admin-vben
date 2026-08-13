<script lang="ts" setup>
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { computed } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

defineOptions({ name: 'FmsVoucherWordSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    filterable?: boolean;
    modelValue?: number;
    options: FmsVoucherWordApi.VoucherWord[];
    placeholder?: string;
  }>(),
  {
    clearable: false,
    disabled: false,
    filterable: false,
    modelValue: undefined,
    placeholder: '请选择凭证字',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) =>
    emit('update:modelValue', typeof value === 'number' ? value : undefined),
});

/** 过滤掉缺少编号的凭证字，保证选项 key 稳定 */
const voucherWordOptions = computed(() =>
  props.options.filter(
    (item): item is FmsVoucherWordApi.VoucherWord & { id: number } =>
      item.id !== undefined,
  ),
);
</script>

<template>
  <ElSelect
    v-model="selectValue"
    :clearable="clearable"
    :disabled="disabled"
    :filterable="filterable"
    :placeholder="placeholder"
    class="w-full"
  >
    <ElOption
      v-for="item in voucherWordOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    />
  </ElSelect>
</template>
