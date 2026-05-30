<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmItemReceiptDetailApi } from '#/api/mes/wm/itemreceipt/detail';
import type { MesWmItemReceiptLineApi } from '#/api/mes/wm/itemreceipt/line';

import { computed, reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getItemReceiptDetailListByLineId } from '#/api/mes/wm/itemreceipt/detail';
import {
  deleteItemReceiptLine,
  getItemReceiptLinePage,
} from '#/api/mes/wm/itemreceipt/line';
import { $t } from '#/locales';
import { PrinterLabel } from '#/views/mes/wm/barcode/components';

import { type FormType, useLineGridColumns } from '../data';
import DetailForm from './detail-form.vue';
import DetailList from './detail-list.vue';
import LineForm from './line-form.vue';

const props = defineProps<{
  formType: FormType;
  noticeId?: number;
  receiptId: number;
}>();

const isEditable = computed(() => // 是否可编辑明细行
  ['create', 'update'].includes(props.formType),
);
const isStock = computed(() => props.formType === 'stock'); // 是否为上架模式
const detailMap = reactive<
  Record<number, MesWmItemReceiptDetailApi.ItemReceiptDetail[]>
>({}); // 已展开行的上架明细缓存

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
  lineFormModalApi
    .setData({ noticeId: props.noticeId, receiptId: props.receiptId })
    .open();
}

/** 编辑物料 */
function handleEdit(row: MesWmItemReceiptLineApi.ItemReceiptLine) {
  lineFormModalApi
    .setData({
      id: row.id,
      noticeId: props.noticeId,
      receiptId: props.receiptId,
    })
    .open();
}

/** 删除物料 */
async function handleDelete(row: MesWmItemReceiptLineApi.ItemReceiptLine) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.itemName]),
  });
  try {
    await deleteItemReceiptLine(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 上架：直接打开明细创建表单 */
function handleStock(row: MesWmItemReceiptLineApi.ItemReceiptLine) {
  openDetailForm(row.id!, row.itemId);
}

/** 打开上架明细表单 */
function openDetailForm(lineId: number, itemId?: number, detailId?: number) {
  detailFormModalApi
    .setData({ detailId, itemId, lineId, receiptId: props.receiptId })
    .open();
}

/** 获取已展开行的上架明细 */
function getExpandedDetails(row: MesWmItemReceiptLineApi.ItemReceiptLine) {
  return detailMap[row.id!] || [];
}

/** 加载指定行的上架明细 */
async function loadLineDetails(lineId: number) {
  detailMap[lineId] = await getItemReceiptDetailListByLineId(lineId);
}

/** 展开行时懒加载上架明细 */
async function handleExpandChange(
  row: MesWmItemReceiptLineApi.ItemReceiptLine,
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
          return await getItemReceiptLinePage({
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
  } as VxeTableGridOptions<MesWmItemReceiptLineApi.ItemReceiptLine>,
  gridEvents: {
    toggleRowExpand: ({
      expanded,
      row,
    }: {
      expanded: boolean;
      row: MesWmItemReceiptLineApi.ItemReceiptLine;
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
                onClick: handleStock.bind(null, row),
              },
            ]"
          />
          <PrinterLabel
            v-if="isStock"
            :biz-code="row.batchCode"
            :biz-id="row.batchId"
            biz-type="ITEM_BATCH"
          />
        </div>
      </template>
    </Grid>
  </div>
</template>
