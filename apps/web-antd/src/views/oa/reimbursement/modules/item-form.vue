<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { OaReimbursementApi } from '#/api/oa/reimbursement';

import { computed, nextTick, ref, watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { cloneDeep, formatDateTime, isEqual } from '@vben/utils';

import { Button, DatePicker, Input, InputNumber, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { DictTag } from '#/components/dict-tag';

import { useFormItemColumns } from '../data';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    modelValue?: OaReimbursementApi.ReimbursementItem[];
  }>(),
  {
    disabled: false,
    modelValue: () => [],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: OaReimbursementApi.ReimbursementItem[]];
}>();

const tableData = ref<OaReimbursementApi.ReimbursementItem[]>([]); // 报销明细数据
const expenseTypeOptions = getDictOptions(DICT_TYPE.OA_EXPENSE_TYPE, 'number'); // 费用类型选项
// 报销金额上限 9999999999999999.99，超出双精度安全整数，取运行时可精确表示的值
const maxPrice = 10_000_000_000_000_000;

/** 票据总数 */
const totalInvoiceCount = computed(() =>
  tableData.value.reduce((total, item) => total + (item.invoiceCount || 0), 0),
);

/** 报销总金额 */
const totalPrice = computed(
  () =>
    tableData.value.reduce(
      (total, item) => total + Math.round((item.price || 0) * 100),
      0,
    ) / 100,
);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useFormItemColumns(props.disabled),
    data: tableData.value,
    autoResize: true,
    border: true,
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

/** 刷新明细表格 */
async function reloadData() {
  await nextTick(); // 特殊：保证 gridApi 已经初始化
  await gridApi.grid?.reloadData(tableData.value);
}

/** 表单值可能只读，使用独立副本编辑；同值回写时不重载表格 */
watch(
  () => props.modelValue,
  async (items) => {
    const next = items ?? [];
    if (isEqual(next, tableData.value)) {
      return;
    }
    tableData.value = cloneDeep(next);
    await reloadData();
  },
  { immediate: true },
);

watch(
  tableData,
  (items) => {
    if (!isEqual(items, props.modelValue)) {
      emit('update:modelValue', cloneDeep(items));
    }
  },
  { deep: true },
);

/** 新增费用明细 */
async function handleAdd() {
  tableData.value.push({ invoiceCount: 0, price: 0 });
  await reloadData();
}

/** 删除费用明细 */
async function handleDelete(index: number) {
  tableData.value.splice(index, 1);
  await reloadData();
}

/** 处理费用发生时间变更 */
function handleExpenseTimeChange(
  row: OaReimbursementApi.ReimbursementItem,
  value?: Dayjs | null | string,
) {
  row.expenseTime = value ? String(value.valueOf()) : undefined;
}
</script>

<template>
  <div class="w-full">
    <div v-if="!disabled" class="mb-2 flex justify-end">
      <Button type="primary" ghost @click="handleAdd">新增明细</Button>
    </div>
    <Grid class="w-full">
      <template #expenseTime="{ row }">
        <DatePicker
          v-if="!disabled"
          :value="row.expenseTime ? dayjs(Number(row.expenseTime)) : undefined"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择费用时间"
          class="w-full"
          @update:value="
            (value: string | Dayjs) => handleExpenseTimeChange(row, value)
          "
        />
        <span v-else>
          {{ row.expenseTime ? formatDateTime(Number(row.expenseTime)) : '-' }}
        </span>
      </template>
      <template #expenseType="{ row }">
        <Select
          v-if="!disabled"
          v-model:value="row.expenseType"
          :options="expenseTypeOptions"
          placeholder="请选择费用类型"
          class="w-full"
        />
        <DictTag
          v-else
          :type="DICT_TYPE.OA_EXPENSE_TYPE"
          :value="row.expenseType"
        />
      </template>
      <template #description="{ row }">
        <Input
          v-if="!disabled"
          v-model:value="row.description"
          placeholder="请输入费用说明"
        />
        <span v-else>{{ row.description || '-' }}</span>
      </template>
      <template #invoiceCount="{ row }">
        <InputNumber
          v-if="!disabled"
          v-model:value="row.invoiceCount"
          :min="0"
          :precision="0"
          :max="2_147_483_647"
          class="w-full"
        />
        <span v-else>{{ row.invoiceCount ?? '-' }}</span>
      </template>
      <template #price="{ row }">
        <InputNumber
          v-if="!disabled"
          v-model:value="row.price"
          :min="0"
          :precision="2"
          :max="maxPrice"
          class="w-full"
        />
        <span v-else>{{ row.price ?? '-' }}</span>
      </template>
      <template #actions="{ $rowIndex }">
        <TableAction
          :actions="[
            {
              label: '删除',
              type: 'link',
              danger: true,
              onClick: handleDelete.bind(null, $rowIndex),
            },
          ]"
        />
      </template>
    </Grid>
    <div v-if="!disabled" class="mt-2 text-right">
      票据合计：{{ totalInvoiceCount }} 张；金额合计：{{ totalPrice }} 元
    </div>
  </div>
</template>
