<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdWorkstationApi } from '#/api/mes/md/workstation';

import { nextTick, ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWorkstationPage } from '#/api/mes/md/workstation';

import {
  useWorkstationSelectGridColumns,
  useWorkstationSelectGridFormSchema,
} from '../data';

const props = withDefaults(
  defineProps<{
    processId?: number;
  }>(),
  {
    processId: undefined,
  },
);
const emit = defineEmits<{
  selected: [rows: MesMdWorkstationApi.Workstation[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(true); // 是否多选
const syncingSingleSelection = ref(false); // 是否同步单选勾选状态
const selectedRows = ref<MesMdWorkstationApi.Workstation[]>([]); // 已选工作站列表
const preSelectedIds = ref<number[]>([]); // 预选工作站编号列表

/** 单选模式下同步 VXE 勾选状态 */
async function syncSingleSelection(row?: MesMdWorkstationApi.Workstation) {
  syncingSingleSelection.value = true;
  await nextTick();
  await gridApi.grid.clearCheckboxRow();
  if (row) {
    await gridApi.grid.setCheckboxRow(row, true);
  }
  await nextTick();
  syncingSingleSelection.value = false;
}

/** 处理勾选变化，单选模式只保留最后一条 */
async function handleCheckboxChange({
  checked,
  records,
  row,
}: {
  checked: boolean;
  records: MesMdWorkstationApi.Workstation[];
  row?: MesMdWorkstationApi.Workstation;
}) {
  if (syncingSingleSelection.value) {
    return;
  }
  if (!multiple.value) {
    const selected = checked && row ? [row] : [];
    selectedRows.value = selected;
    await syncSingleSelection(selected[0]);
    return;
  }
  selectedRows.value = records;
}

/** 处理全选变化 */
function handleCheckboxAll({
  records,
}: {
  records: MesMdWorkstationApi.Workstation[];
}) {
  if (syncingSingleSelection.value) {
    return;
  }
  selectedRows.value = records;
}

/** 回显预选工作站 */
function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesMdWorkstationApi.Workstation[];
  for (const row of rows) {
    if (row.id && preSelectedIds.value.includes(row.id)) {
      gridApi.grid.setCheckboxRow(row, true);
      if (!multiple.value) {
        selectedRows.value = [row];
      }
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useWorkstationSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useWorkstationSelectGridColumns(),
    height: 520,
    keepSource: true,
    checkboxConfig: {
      highlight: true,
      range: true,
      reserve: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getWorkstationPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            status: CommonStatusEnum.ENABLE,
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
  } as VxeTableGridOptions<MesMdWorkstationApi.Workstation>,
  gridEvents: {
    checkboxAll: handleCheckboxAll,
    checkboxChange: handleCheckboxChange,
  },
});

/** 重置查询和选择状态 */
async function resetQueryState() {
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
  await gridApi.formApi.resetForm();
  if (props.processId) {
    await gridApi.formApi.setFieldValue('processId', props.processId);
  }
}

/** 打开工作站选择弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  applyPreSelection();
}

/** 关闭工作站选择弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择工作站 */
function handleConfirm() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
    return;
  }
  emit(
    'selected',
    multiple.value ? selectedRows.value : [selectedRows.value[0]!],
  );
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <ElDialog
    v-model="open"
    title="工作站选择"
    width="70%"
    destroy-on-close
    @close="closeModal"
  >
    <Grid table-title="工作站列表" />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
