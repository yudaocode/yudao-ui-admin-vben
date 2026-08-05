<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { SystemDeptApi } from '#/api/system/dept';

import { nextTick, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Button, message, Modal, Radio } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getEmployeeSimpleList,
  getEmployeeSimplePage,
} from '#/api/hrm/employee';
import { DictTag } from '#/components/dict-tag';
import { DeptTreeSelect } from '#/views/system/dept/components';

const emit = defineEmits<{
  selected: [rows: HrmEmployeeApi.Employee[]];
}>();

const open = ref(false);
const multiple = ref(false);
const entryStatus = ref<number>();
const disabledIds = ref<number[]>([]);
const enabledIds = ref<number[] | undefined>(undefined);
const selectedRowMap = ref(new Map<number, HrmEmployeeApi.Employee>());
const selectedRadioId = ref<number>();
const selectedRadioRow = ref<HrmEmployeeApi.Employee>();
const deptId = ref<number>();

function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '员工姓名',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入员工姓名' },
    },
    {
      fieldName: 'jobNumber',
      label: '工号',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入工号' },
    },
  ];
}

function useGridColumns(
  isMulti: boolean,
): VxeTableGridOptions<HrmEmployeeApi.Employee>['columns'] {
  return [
    {
      type: isMulti ? 'checkbox' : undefined,
      width: 50,
      slots: isMulti ? undefined : { default: 'radio' },
    },
    { field: 'name', title: '员工姓名', minWidth: 120 },
    { field: 'jobNumber', title: '工号', minWidth: 110 },
    { field: 'deptName', title: '部门', minWidth: 120 },
    { field: 'mobile', title: '手机号', minWidth: 130 },
    {
      field: 'entryStatus',
      title: '入职状态',
      minWidth: 100,
      slots: { default: 'entryStatus' },
    },
  ];
}

function isRowDisabled(row: HrmEmployeeApi.Employee) {
  if (!row.id || disabledIds.value.includes(row.id)) {
    return true;
  }
  if (enabledIds.value !== undefined && !enabledIds.value.includes(row.id)) {
    return true;
  }
  if (
    entryStatus.value !== undefined &&
    row.entryStatus !== entryStatus.value
  ) {
    return true;
  }
  return false;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema() },
  gridOptions: {
    columns: useGridColumns(false),
    height: 420,
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          return await getEmployeeSimplePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            deptId: deptId.value,
            entryStatus: entryStatus.value,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    checkboxConfig: {
      checkMethod: ({ row }: { row: HrmEmployeeApi.Employee }) =>
        !isRowDisabled(row),
    },
  },
  gridEvents: {
    checkboxChange: ({ records }: { records: HrmEmployeeApi.Employee[] }) => {
      for (const row of gridApi.grid?.getData() || []) {
        if (row.id) {
          selectedRowMap.value.delete(row.id);
        }
      }
      for (const row of records) {
        if (row.id) {
          selectedRowMap.value.set(row.id, row);
        }
      }
    },
    checkboxAll: ({ records }: { records: HrmEmployeeApi.Employee[] }) => {
      selectedRowMap.value.clear();
      for (const row of records) {
        if (row.id) {
          selectedRowMap.value.set(row.id, row);
        }
      }
    },
    cellClick: ({ row }: { row: HrmEmployeeApi.Employee }) => {
      if (multiple.value || isRowDisabled(row) || !row.id) {
        return;
      }
      selectedRadioId.value = row.id;
      selectedRadioRow.value = row;
    },
  },
});

async function handleOpen(options: {
  disabledIds?: number[];
  enabledIds?: number[];
  entryStatus?: number;
  multiple?: boolean;
  selectedIds?: number[];
  title?: string;
}) {
  multiple.value = options.multiple ?? false;
  entryStatus.value = options.entryStatus;
  disabledIds.value = options.disabledIds || [];
  enabledIds.value = options.enabledIds;
  selectedRowMap.value = new Map();
  selectedRadioId.value = undefined;
  selectedRadioRow.value = undefined;
  open.value = true;
  gridApi.setGridOptions({ columns: useGridColumns(multiple.value) });
  const preselectedIds = (options.selectedIds || []).filter(
    (id) => !disabledIds.value.includes(id),
  );
  if (preselectedIds.length > 0) {
    const rows = await getEmployeeSimpleList(preselectedIds);
    for (const row of rows) {
      if (row.id) {
        selectedRowMap.value.set(row.id, row);
      }
    }
    if (!multiple.value) {
      selectedRadioId.value = preselectedIds[0];
      selectedRadioRow.value = rows[0];
    }
  }
  await nextTick();
  await gridApi.query();
}

function handleConfirm() {
  const rows = multiple.value
    ? [...selectedRowMap.value.values()]
    : selectedRadioRow.value
      ? [selectedRadioRow.value]
      : [];
  if (rows.length === 0) {
    message.warning('请选择员工');
    return;
  }
  emit('selected', rows);
  open.value = false;
}

function handleDeptSelect(dept?: SystemDeptApi.Dept) {
  deptId.value = dept?.id;
  gridApi.query();
}

defineExpose({ open: handleOpen });
</script>

<template>
  <Modal
    v-model:open="open"
    :footer="null"
    title="选择员工"
    width="960px"
    destroy-on-close
  >
    <div class="mb-3 flex gap-3">
      <DeptTreeSelect
        class="w-56"
        placeholder="按部门筛选"
        @select="handleDeptSelect"
      />
    </div>
    <Grid>
      <template #radio="{ row }">
        <Radio
          :checked="selectedRadioId === row.id"
          :disabled="isRowDisabled(row as HrmEmployeeApi.Employee)"
          @change="
            () => {
              selectedRadioId = row.id;
              selectedRadioRow = row as HrmEmployeeApi.Employee;
            }
          "
        />
      </template>
      <template #entryStatus="{ row }">
        <DictTag
          :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
          :value="row.entryStatus"
        />
      </template>
    </Grid>
    <div class="mt-4 flex justify-end gap-2">
      <Button @click="open = false">取消</Button>
      <Button type="primary" @click="handleConfirm">确定</Button>
    </div>
  </Modal>
</template>
