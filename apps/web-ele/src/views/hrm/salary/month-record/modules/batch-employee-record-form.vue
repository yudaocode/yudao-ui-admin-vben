<script lang="ts" setup>
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';

import { ElInputNumber, ElMessage, ElTable, ElTableColumn } from 'element-plus';

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

defineOptions({ name: 'HrmSalaryBatchEmployeeRecordForm' });

const emit = defineEmits(['success']);

const loading = ref(false);
const edited = ref(false);
const editedEmployeeIdSet = ref<Set<number>>(new Set());
const list = ref<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord[]>(
  [],
);
const editableOptions = ref<
  NonNullable<HrmSalaryMonthRecordApi.SalaryMonthRecord['optionHeaders']>
>([]);

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
      ElMessage.success('更新成功');
      edited.value = false;
      editedEmployeeIdSet.value = new Set();
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      list.value = [];
      editableOptions.value = [];
      edited.value = false;
      editedEmployeeIdSet.value = new Set();
    }
  },
  title: '在线编辑工资',
});

async function open(
  record: HrmSalaryMonthRecordApi.SalaryMonthRecord,
  queryParams: {
    deptId?: number;
    employeeChangeType?: number;
    employeeName?: string;
    jobNumber?: string;
  },
) {
  if (!record.id) {
    return;
  }
  modalApi.open();
  loading.value = true;
  try {
    list.value = await getSalaryMonthEmployeeRecordList({
      deptId: queryParams.deptId,
      employeeChangeType: queryParams.employeeChangeType,
      employeeName: queryParams.employeeName,
      jobNumber: queryParams.jobNumber,
      monthRecordId: record.id,
    });
    editableOptions.value = getSalaryLeafOptions(record.optionHeaders).filter(
      (option) => !HRM_SALARY_COMPUTED_OPTION_CODES.has(option.code),
    );
    edited.value = false;
    editedEmployeeIdSet.value = new Set();
  } finally {
    loading.value = false;
  }
}

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
  value: null | number | undefined,
) {
  updateSalaryOptionValue(record, optionCode, value ?? null);
  handleOptionChange(record.id);
}

defineExpose({ open });
</script>

<template>
  <Modal>
    <ElTable
      v-loading="loading"
      :data="list"
      border
      height="calc(100vh - 300px)"
      row-key="id"
      size="small"
    >
      <ElTableColumn
        fixed="left"
        label="员工姓名"
        min-width="130"
        prop="employeeName"
      />
      <ElTableColumn fixed="left" label="工号" prop="jobNumber" width="120" />
      <ElTableColumn
        fixed="left"
        label="部门"
        min-width="130"
        prop="deptName"
      />
      <ElTableColumn
        fixed="left"
        label="岗位"
        min-width="130"
        prop="postName"
      />
      <ElTableColumn
        v-for="option in editableOptions"
        :key="option.code"
        :label="option.name"
        align="center"
        min-width="150"
      >
        <template #default="{ row }">
          <ElInputNumber
            :controls="false"
            :max="100000000"
            :min="0"
            :model-value="getSalaryOptionNumberValue(row, option.code)"
            :precision="2"
            class="!w-full"
            @update:model-value="
              (value) => handleOptionUpdate(row, option.code, value)
            "
          />
        </template>
      </ElTableColumn>
    </ElTable>
    <template #prepend-footer>
      <span class="text-muted-foreground">
        已修改 {{ editedEmployeeIdSet.size }} 人
      </span>
    </template>
  </Modal>
</template>
