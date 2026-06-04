<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmOutsourceReceiptDetailApi } from '#/api/mes/wm/outsourcereceipt/detail';
import type { MesWmOutsourceReceiptLineApi } from '#/api/mes/wm/outsourcereceipt/line';

import { computed, reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getOutsourceReceiptDetailListByLineId } from '#/api/mes/wm/outsourcereceipt/detail';
import {
  deleteOutsourceReceiptLine,
  getOutsourceReceiptLinePage,
} from '#/api/mes/wm/outsourcereceipt/line';
import { $t } from '#/locales';
import { PrinterLabel } from '#/views/mes/wm/barcode/components';

import { type FormType, useLineGridColumns } from '../data';
import DetailForm from './detail-form.vue';
import DetailList from './detail-list.vue';
import LineForm from './line-form.vue';

const props = defineProps<{
  formType: FormType;
  receiptId: number;
}>();

const isEditable = computed(() => // 是否可编辑明细行
  ['create', 'update'].includes(props.formType),
);
const isStock = computed(() => props.formType === 'stock'); // 是否为上架模式
const detailMap = reactive<
  Record<number, MesWmOutsourceReceiptDetailApi.OutsourceReceiptDetail[]>
>({}); // 已展开行的收货明细缓存

const [LineFormModal, lineFormModalApi] = useVbenModal({
  connectedComponent: LineForm,
  destroyOnClose: true,
});

const [DetailFormModal, detailFormModalApi] = useVbenModal({
  connectedComponent: DetailForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  for (const id of Object.keys(detailMap)) {
    delete detailMap[Number(id)];
  }
  gridApi.query();
}

/** 添加物料 */
function handleCreate() {
  lineFormModalApi.setData({ receiptId: props.receiptId }).open();
}

/** 编辑物料 */
function handleEdit(row: MesWmOutsourceReceiptLineApi.OutsourceReceiptLine) {
  lineFormModalApi.setData({ id: row.id, receiptId: props.receiptId }).open();
}

/** 删除物料 */
async function handleDelete(
  row: MesWmOutsourceReceiptLineApi.OutsourceReceiptLine,
) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.itemName]),
  });
  try {
    await deleteOutsourceReceiptLine(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 上架：直接打开明细创建表单 */
function handlePicking(row: MesWmOutsourceReceiptLineApi.OutsourceReceiptLine) {
  openDetailForm(row.id!, row.itemId);
}

/** 打开收货明细表单 */
function openDetailForm(lineId: number, itemId?: number, detailId?: number) {
  detailFormModalApi
    .setData({ detailId, itemId, lineId, receiptId: props.receiptId })
    .open();
}

/** 获取已展开行的收货明细 */
function getExpandedDetails(
  row: MesWmOutsourceReceiptLineApi.OutsourceReceiptLine,
) {
  return detailMap[row.id!] || [];
}

/** 加载指定行的收货明细 */
async function loadLineDetails(lineId: number) {
  detailMap[lineId] = await getOutsourceReceiptDetailListByLineId(lineId);
}

/** 展开行时懒加载收货明细 */
async function handleExpandChange(
  row: MesWmOutsourceReceiptLineApi.OutsourceReceiptLine,
  expanded: boolean,
) {
  if (!expanded) {
    return;
  }
  await loadLineDetails(row.id!);
}

/** 明细表单提交成功后，刷新对应行已展开的明细 */
async function handleDetailSuccess(lineId: number) {
  await loadLineDetails(lineId);
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useLineGridColumns(isEditable.value, isStock.value),
    expandConfig: {
      padding: true,
    },
    height: 400,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.receiptId) {
            return { list: [], total: 0 };
          }
          return await getOutsourceReceiptLinePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            receiptId: props.receiptId,
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
  } as VxeTableGridOptions<MesWmOutsourceReceiptLineApi.OutsourceReceiptLine>,
  gridEvents: {
    toggleRowExpand: ({
      expanded,
      row,
    }: {
      expanded: boolean;
      row: MesWmOutsourceReceiptLineApi.OutsourceReceiptLine;
    }) => {
      handleExpandChange(row, expanded);
    },
  },
});
</script>

<template>
  <div>
    <LineFormModal @success="handleRefresh" />
    <DetailFormModal @success="handleDetailSuccess" />
    <Grid table-title="物料信息">
      <template v-if="isEditable" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '添加物料',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #detail="{ row }">
        <DetailList
          :details="getExpandedDetails(row)"
          :form-type="formType"
          @edit="(detailId) => openDetailForm(row.id!, row.itemId, detailId)"
          @refresh="loadLineDetails(row.id!)"
        />
      </template>
      <template #actions="{ row }">
        <div class="flex items-center justify-center">
          <TableAction
            :actions="[
              {
                label: $t('common.edit'),
                type: 'primary',
                link: true,
                icon: ACTION_ICON.EDIT,
                ifShow: isEditable,
                onClick: handleEdit.bind(null, row),
              },
              {
                label: $t('common.delete'),
                type: 'danger',
                link: true,
                icon: ACTION_ICON.DELETE,
                ifShow: isEditable,
                popConfirm: {
                  title: $t('ui.actionMessage.deleteConfirm', [row.itemName]),
                  confirm: handleDelete.bind(null, row),
                },
              },
              {
                label: '上架',
                type: 'primary',
                link: true,
                ifShow: isStock,
                onClick: handlePicking.bind(null, row),
              },
            ]"
          />
          <PrinterLabel
            v-if="isStock"
            :biz-code="row.batchCode"
            :biz-id="row.batchId"
            biz-type="BATCH"
          />
        </div>
      </template>
    </Grid>
  </div>
</template>
