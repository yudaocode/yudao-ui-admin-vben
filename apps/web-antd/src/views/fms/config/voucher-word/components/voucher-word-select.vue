<script lang="ts" setup>
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { computed } from 'vue';

import { Select } from 'ant-design-vue';

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

/** 过滤掉缺少编号的凭证字，保证选项 value 稳定 */
const selectOptions = computed(() =>
  props.options
    .filter(
      (item): item is FmsVoucherWordApi.VoucherWord & { id: number } =>
        item.id !== undefined,
    )
    .map((item) => ({ label: item.name, value: item.id })),
);
</script>

<template>
  <Select
    v-model:value="selectValue"
    :allow-clear="clearable"
    :disabled="disabled"
    :options="selectOptions"
    :placeholder="placeholder"
    :show-search="filterable"
    class="w-full"
    option-filter-prop="label"
  />
</template>
