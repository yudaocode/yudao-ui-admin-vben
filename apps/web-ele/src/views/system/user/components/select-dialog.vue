<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { nextTick, ref } from 'vue';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton, ElCol, ElDialog, ElMessage, ElRow } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserPage } from '#/api/system/user';
import { DeptTreeSelect } from '#/views/system/dept/components';

const emit = defineEmits<{
  selected: [rows: SystemUserApi.User[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选；默认按单选选择器使用
const selectedRows = ref<SystemUserApi.User[]>([]); // 已选用户列表
const preSelectedIds = ref<number[]>([]); // 预选用户编号列表
const deptId = ref<number>(); // 当前部门过滤
const deptTreeRef = ref<InstanceType<typeof DeptTreeSelect>>(); // 部门树

/** 用户选择弹窗的搜索表单 */
function useUserSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'username',
      label: '用户名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入用户名称',
      },
    },
    {
      fieldName: 'nickname',
      label: '用户昵称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入用户昵称',
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入手机号码',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 用户选择弹窗的字段 */
function useUserSelectGridColumns(
  isMultiple = false,
): VxeTableGridOptions<SystemUserApi.User>['columns'] {
  return [
    {
      type: isMultiple ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'id',
      title: '用户编号',
      width: 120,
    },
    {
      field: 'username',
      title: '用户名称',
      width: 150,
    },
    {
      field: 'nickname',
      title: '用户昵称',
      minWidth: 150,
    },
    {
      field: 'mobile',
      title: '手机号码',
      width: 130,
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
  ];
}

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, SystemUserApi.User>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as SystemUserApi.User[];
  records.forEach((row) => {
    const rowId = row.id;
    if (rowId !== undefined) {
      selectedMap.set(rowId, row);
    }
  });
  return [...selectedMap.values()];
}

/** 处理多选勾选变化 */
function handleCheckboxSelectChange() {
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理单选切换 */
function handleRadioChange(row: SystemUserApi.User) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: SystemUserApi.User) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击：单选直接确认，多选切换勾选 */
async function handleCellDblclick({ row }: { row: SystemUserApi.User }) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选用户 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as SystemUserApi.User[];
  for (const row of rows) {
    if (row.id === undefined || !preSelectedIds.value.includes(row.id)) {
      continue;
    }
    if (multiple.value) {
      await gridApi.grid.setCheckboxRow(row, true);
    } else {
      await gridApi.grid.setRadioRow(row);
      selectedRows.value = [row];
      return;
    }
  }
  if (multiple.value) {
    selectedRows.value = getMultipleSelectedRows();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useUserSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useUserSelectGridColumns(false),
    height: 520,
    keepSource: true,
    checkboxConfig: {
      highlight: true,
      range: true,
      reserve: true,
    },
    radioConfig: {
      highlight: true,
      trigger: 'row',
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            deptId: deptId.value,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<SystemUserApi.User>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: SystemUserApi.User }) => {
      handleRadioChange(row);
    },
  },
});

/** 部门树节点点击 */
function handleDeptNodeClick(dept?: SystemDeptApi.Dept) {
  deptId.value = dept?.id;
  gridApi.query();
}

/** 重置查询和选择状态 */
async function resetQueryState() {
  selectedRows.value = [];
  deptId.value = undefined;
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.resetForm();
  deptTreeRef.value?.reset();
}

/** 打开用户选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? false;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  gridApi.setGridOptions({
    columns: useUserSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.formApi.setFieldValue('status', CommonStatusEnum.ENABLE);
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭用户选择弹窗 */
function closeModal() {
  open.value = false;
}

/** 确认选择用户 */
function handleConfirm() {
  const rows = multiple.value ? getMultipleSelectedRows() : selectedRows.value;
  if (rows.length === 0) {
    ElMessage.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
    return;
  }
  emit('selected', multiple.value ? rows : [rows[0]!]);
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <ElDialog v-model="open" title="人员选择" width="80%">
    <ElRow :gutter="12">
      <ElCol :span="5">
        <DeptTreeSelect ref="deptTreeRef" @select="handleDeptNodeClick" />
      </ElCol>
      <ElCol :span="19">
        <Grid table-title="用户列表" />
      </ElCol>
    </ElRow>
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
