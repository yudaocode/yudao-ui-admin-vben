<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerGroupApi } from '#/api/im/manager/group';

import { nextTick, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getManagerGroup, getManagerGroupPage } from '#/api/im/manager/group';

const emit = defineEmits<{
  selected: [rows: ImManagerGroupApi.Group[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(false); // 是否多选
const selectedRows = ref<ImManagerGroupApi.Group[]>([]); // 已选群列表
const preSelectedIds = ref<number[]>([]); // 预选群编号列表

/** 群选择弹窗的搜索表单 */
function useGroupSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '群名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入群名称',
      },
    },
    {
      fieldName: 'status',
      label: '群状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.IM_GROUP_STATUS, 'number'),
        placeholder: '请选择群状态',
      },
    },
  ];
}

/** 群选择弹窗的字段 */
function useGroupSelectGridColumns(
  isMultiple = false,
): VxeTableGridOptions<ImManagerGroupApi.Group>['columns'] {
  return [
    {
      type: isMultiple ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      field: 'name',
      title: '群名称',
      minWidth: 160,
    },
    {
      field: 'ownerNickname',
      title: '群主',
      minWidth: 160,
    },
    {
      field: 'memberCount',
      title: '成员数',
      width: 90,
    },
    {
      field: 'status',
      title: '群状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_GROUP_STATUS },
      },
    },
  ];
}

/** 获取多选记录，包含 VXE reserve 跨页记录 */
function getMultipleSelectedRows() {
  const selectedMap = new Map<number, ImManagerGroupApi.Group>();
  const records = [
    ...(gridApi.grid.getCheckboxReserveRecords?.() ?? []),
    ...(gridApi.grid.getCheckboxRecords?.() ?? []),
  ] as ImManagerGroupApi.Group[];
  records.forEach((row) => {
    selectedMap.set(row.id, row);
  });
  return [...selectedMap.values()];
}

/** 处理多选勾选变化 */
function handleCheckboxSelectChange() {
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理单选切换 */
function handleRadioChange(row: ImManagerGroupApi.Group) {
  selectedRows.value = [row];
}

/** 多选模式下切换行勾选 */
async function toggleMultipleRow(row: ImManagerGroupApi.Group) {
  const selected = gridApi.grid.isCheckedByCheckboxRow(row);
  await gridApi.grid.setCheckboxRow(row, !selected);
  selectedRows.value = getMultipleSelectedRows();
}

/** 处理行双击：单选直接确认，多选切换勾选 */
async function handleCellDblclick({ row }: { row: ImManagerGroupApi.Group }) {
  if (multiple.value) {
    await toggleMultipleRow(row);
    return;
  }
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选群 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as ImManagerGroupApi.Group[];
  for (const row of rows) {
    if (!preSelectedIds.value.includes(row.id)) {
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
    return;
  }
  const targetId = preSelectedIds.value[0];
  if (targetId) {
    selectedRows.value = [await getManagerGroup(targetId)];
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGroupSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useGroupSelectGridColumns(false),
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
          return await getManagerGroupPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
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
  } as VxeTableGridOptions<ImManagerGroupApi.Group>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    checkboxAll: handleCheckboxSelectChange,
    checkboxChange: handleCheckboxSelectChange,
    radioChange: ({ row }: { row: ImManagerGroupApi.Group }) => {
      handleRadioChange(row);
    },
  },
});

/** 重置查询和选择状态 */
async function resetQueryState() {
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearCheckboxReserve();
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.resetForm();
}

/** 打开群选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? false;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  gridApi.setGridOptions({
    columns: useGroupSelectGridColumns(multiple.value),
  });
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭群选择弹窗 */
function closeModal() {
  open.value = false;
}

/** 确认选择群 */
function handleConfirm() {
  const rows = multiple.value ? getMultipleSelectedRows() : selectedRows.value;
  if (rows.length === 0) {
    message.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
    return;
  }
  emit('selected', multiple.value ? rows : [rows[0]]);
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <Modal
    v-model:open="open"
    title="群选择"
    width="70%"
    :destroy-on-close="true"
    @ok="handleConfirm"
    @cancel="closeModal"
  >
    <Grid table-title="群列表" />
    <template #footer>
      <Button @click="closeModal">取消</Button>
      <Button type="primary" @click="handleConfirm">确定</Button>
    </template>
  </Modal>
</template>
