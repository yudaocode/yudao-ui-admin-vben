<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmArrivalNoticeLineApi } from '#/api/mes/wm/arrivalnotice/line';

import { nextTick, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getArrivalNoticeLinePage } from '#/api/mes/wm/arrivalnotice/line';

const emit = defineEmits<{
  selected: [rows: MesWmArrivalNoticeLineApi.ArrivalNoticeLine[]];
}>();

const open = ref(false); // 弹窗是否打开
const noticeId = ref<number>(); // 所属通知单编号
const syncingSingleSelection = ref(false); // 是否同步单选勾选状态
const selectedRows = ref<MesWmArrivalNoticeLineApi.ArrivalNoticeLine[]>([]); // 已选行列表
const preSelectedIds = ref<number[]>([]); // 预选行编号列表

/** 表格字段 */
function useGridColumns(): VxeTableGridOptions<MesWmArrivalNoticeLineApi.ArrivalNoticeLine>['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
    },
    {
      field: 'itemCode',
      title: '物料编码',
      minWidth: 120,
    },
    {
      field: 'itemName',
      title: '物料名称',
      minWidth: 140,
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'arrivalQuantity',
      title: '到货数量',
      width: 100,
    },
    {
      field: 'iqcCheckFlag',
      title: '是否检验',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'qualifiedQuantity',
      title: '合格数量',
      width: 100,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
  ];
}

/** 单选模式下同步 VXE 勾选状态 */
async function syncSingleSelection(
  row?: MesWmArrivalNoticeLineApi.ArrivalNoticeLine,
) {
  syncingSingleSelection.value = true;
  await nextTick();
  await gridApi.grid.clearCheckboxRow();
  if (row) {
    await gridApi.grid.setCheckboxRow(row, true);
  }
  await nextTick();
  syncingSingleSelection.value = false;
}

/** 处理勾选变化，只保留最后一条 */
async function handleCheckboxChange({
  checked,
  row,
}: {
  checked: boolean;
  row?: MesWmArrivalNoticeLineApi.ArrivalNoticeLine;
}) {
  if (syncingSingleSelection.value) {
    return;
  }
  const selected = checked && row ? [row] : [];
  selectedRows.value = selected;
  await syncSingleSelection(selected[0]);
}

/** 回显预选行 */
function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows =
    gridApi.grid.getData() as MesWmArrivalNoticeLineApi.ArrivalNoticeLine[];
  for (const row of rows) {
    if (row.id && preSelectedIds.value.includes(row.id)) {
      gridApi.grid.setCheckboxRow(row, true);
      selectedRows.value = [row];
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 460,
    keepSource: true,
    checkboxConfig: {
      highlight: true,
      reserve: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!noticeId.value) {
            return { list: [], total: 0 };
          }
          return await getArrivalNoticeLinePage({
            noticeId: noticeId.value,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
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
    },
  } as VxeTableGridOptions<MesWmArrivalNoticeLineApi.ArrivalNoticeLine>,
  gridEvents: {
    checkboxChange: handleCheckboxChange,
  },
});

/** 打开行选择弹窗 */
async function openModal(id: number | undefined, selectedIds?: number[]) {
  open.value = true;
  noticeId.value = id;
  preSelectedIds.value = selectedIds || [];
  selectedRows.value = [];
  await nextTick();
  await gridApi.grid.clearCheckboxRow();
  await gridApi.query();
  await nextTick();
  applyPreSelection();
}

/** 关闭弹窗 */
async function closeModal() {
  open.value = false;
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
}

/** 确认选择行 */
function handleConfirm() {
  if (selectedRows.value.length === 0) {
    message.warning('请选择一条数据');
    return;
  }
  emit('selected', [selectedRows.value[0]!]);
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <Modal
    v-model:open="open"
    title="到货通知单行选择"
    width="70%"
    :destroy-on-close="true"
    @cancel="closeModal"
    @ok="handleConfirm"
  >
    <Grid table-title="到货通知单行列表" />
  </Modal>
</template>
