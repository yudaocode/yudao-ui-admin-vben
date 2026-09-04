<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { nextTick, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';

import { InputNumber, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getSalaryMonthEmployeeRecordList,
  updateSalaryMonthEmployeeRecordList,
} from '#/api/hrm/salary/month-record/employee';
import {
  getSalaryLeafOptions,
  getSalaryOptionNumberValue,
  updateSalaryOptionValue,
} from '#/views/hrm/salary/utils/option';
import { HRM_SALARY_COMPUTED_OPTION_CODES } from '#/views/hrm/utils/constants';

import { buildEditableGridColumns } from '../data';

defineOptions({ name: 'HrmSalaryBatchEmployeeRecordForm' });

const emit = defineEmits(['success']);

const edited = ref(false);
const editedEmployeeIdSet = ref<Set<number>>(new Set());
const list = ref<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord[]>(
  [],
);
const editableOptions = ref<
  NonNullable<HrmSalaryMonthRecordApi.SalaryMonthRecord['optionHeaders']>
>([]);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: [],
    data: [],
    height: 'calc(100vh - 260px)',
    minHeight: 260,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord>,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[calc(100vw-32px)]',
  async onBeforeClose() {
    if (!edited.value) {
      return true;
    }
    try {
      await confirm({
        content: '当前修改尚未保存，确定放弃编辑吗？',
        title: '放弃编辑',
      });
      edited.value = false;
      return true;
    } catch {
      return false;
    }
  },
  async onConfirm() {
    if (editedEmployeeIdSet.value.size === 0) {
      await modalApi.close();
      return;
    }
    modalApi.lock();
    try {
      await updateSalaryMonthEmployeeRecordList(
        list.value
          .filter((item) => item.id && editedEmployeeIdSet.value.has(item.id))
          .map((item) => ({
            id: item.id,
            optionValues: item.optionValues || [],
          })),
      );
      message.success('更新成功');
      edited.value = false;
      editedEmployeeIdSet.value = new Set();
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      list.value = [];
      editableOptions.value = [];
      edited.value = false;
      editedEmployeeIdSet.value = new Set();
      return;
    }
    const { record, queryParams } = modalApi.getData() as {
      queryParams: {
        deptId?: number;
        employeeChangeType?: number;
        employeeName?: string;
        jobNumber?: string;
      };
      record: HrmSalaryMonthRecordApi.SalaryMonthRecord;
    };
    if (!record?.id) return;
    modalApi.lock();
    try {
      list.value = await getSalaryMonthEmployeeRecordList({
        ...queryParams,
        monthRecordId: record.id,
      });
      editableOptions.value = getSalaryLeafOptions(record.optionHeaders).filter(
        (option) => !HRM_SALARY_COMPUTED_OPTION_CODES.has(option.code),
      );
      gridApi.setGridOptions({
        columns: buildEditableGridColumns(editableOptions.value),
      });
      await nextTick();
      await gridApi.grid.reloadData(list.value);
    } finally {
      modalApi.unlock();
    }
  },
  title: '在线编辑工资',
});

function handleOptionChange(employeeRecordId?: number) {
  if (!employeeRecordId) {
    return;
  }
  editedEmployeeIdSet.value.add(employeeRecordId);
  editedEmployeeIdSet.value = new Set(editedEmployeeIdSet.value);
  edited.value = true;
}

function handleOptionUpdate(
  record: HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord,
  optionCode: number,
  value: null | number,
) {
  updateSalaryOptionValue(record, optionCode, value);
  handleOptionChange(record.id);
}
</script>

<template>
  <Modal>
    <Grid class="w-full">
      <template #optionValue="{ column, row }">
        <InputNumber
          :controls="false"
          :max="100000000"
          :min="0"
          :precision="2"
          :value="
            getSalaryOptionNumberValue(
              row,
              Number(String(column.field).replace('option-', '')),
            )
          "
          class="w-full"
          @update:value="
            (value) =>
              handleOptionUpdate(
                row,
                Number(String(column.field).replace('option-', '')),
                value as number | null,
              )
          "
        />
      </template>
    </Grid>
    <template #prepend-footer>
      <span class="text-muted-foreground">
        已修改 {{ editedEmployeeIdSet.size }} 人
      </span>
    </template>
  </Modal>
</template>
