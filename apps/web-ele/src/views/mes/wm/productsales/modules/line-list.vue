<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmProductSalesDetailApi } from '#/api/mes/wm/productsales/detail';
import type { MesWmProductSalesLineApi } from '#/api/mes/wm/productsales/line';

import { computed, reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProductSalesDetailListByLineId } from '#/api/mes/wm/productsales/detail';
import {
  deleteProductSalesLine,
  getProductSalesLinePage,
} from '#/api/mes/wm/productsales/line';
import { $t } from '#/locales';

import { type FormType, useLineGridColumns } from '../data';
import DetailForm from './detail-form.vue';
import DetailList from './detail-list.vue';
import LineForm from './line-form.vue';

const props = defineProps<{
  formType: FormType;
  noticeId?: number;
  salesId: number;
}>();

const isEditable = computed(() => // 是否可编辑明细行
  ['create', 'update'].includes(props.formType),
);
const isStock = computed(() => props.formType === 'stock'); // 是否为拣货模式
const detailMap = reactive<
  Record<number, MesWmProductSalesDetailApi.ProductSalesDetail[]>
>({}); // 已展开行的拣货明细缓存

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
    .setData({ noticeId: props.noticeId, salesId: props.salesId })
    .open();
}

/** 编辑物料 */
function handleEdit(row: MesWmProductSalesLineApi.ProductSalesLine) {
  lineFormModalApi
    .setData({ id: row.id, noticeId: props.noticeId, salesId: props.salesId })
    .open();
}

/** 删除物料 */
async function handleDelete(row: MesWmProductSalesLineApi.ProductSalesLine) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.itemName]),
  });
  try {
    await deleteProductSalesLine(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 拣货：直接打开明细创建表单 */
function handlePicking(row: MesWmProductSalesLineApi.ProductSalesLine) {
  openDetailForm(row.id!, row.itemId, row.batchId);
}

/** 打开拣货明细表单 */
function openDetailForm(
  lineId: number,
  itemId?: number,
  batchId?: number,
  detailId?: number,
) {
  detailFormModalApi
    .setData({ batchId, detailId, itemId, lineId, salesId: props.salesId })
    .open();
}

/** 获取已展开行的拣货明细 */
function getExpandedDetails(row: MesWmProductSalesLineApi.ProductSalesLine) {
  return detailMap[row.id!] || [];
}

/** 加载指定行的拣货明细 */
async function loadLineDetails(lineId: number) {
  detailMap[lineId] = await getProductSalesDetailListByLineId(lineId);
}

/** 展开行时懒加载拣货明细 */
async function handleExpandChange(
  row: MesWmProductSalesLineApi.ProductSalesLine,
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
          if (!props.salesId) {
            return { list: [], total: 0 };
          }
          return await getProductSalesLinePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            salesId: props.salesId,
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
  } as VxeTableGridOptions<MesWmProductSalesLineApi.ProductSalesLine>,
  gridEvents: {
    toggleRowExpand: ({
      expanded,
      row,
    }: {
      expanded: boolean;
      row: MesWmProductSalesLineApi.ProductSalesLine;
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
          @edit="
            (detailId) =>
              openDetailForm(row.id!, row.itemId, row.batchId, detailId)
          "
          @refresh="loadLineDetails(row.id!)"
        />
      </template>
      <template #actions="{ row }">
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
              label: '拣货',
              type: 'primary',
              link: true,
              ifShow: isStock,
              onClick: handlePicking.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
