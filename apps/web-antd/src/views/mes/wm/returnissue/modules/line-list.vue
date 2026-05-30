<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmReturnIssueDetailApi } from '#/api/mes/wm/returnissue/detail';
import type { MesWmReturnIssueLineApi } from '#/api/mes/wm/returnissue/line';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getReturnIssueDetailListByLineId } from '#/api/mes/wm/returnissue/detail';
import {
  deleteReturnIssueLine,
  getReturnIssueLinePage,
} from '#/api/mes/wm/returnissue/line';
import { $t } from '#/locales';
import { BarcodeDetail, PrinterLabel } from '#/views/mes/wm/barcode/components';

import { type FormType, useLineGridColumns } from '../data';
import DetailForm from './detail-form.vue';
import DetailList from './detail-list.vue';
import LineForm from './line-form.vue';

const props = defineProps<{
  formType: FormType;
  issueId: number;
}>();

const isEditable = computed(() => // 是否可编辑明细行
  ['create', 'update'].includes(props.formType),
);
const isStock = computed(() => props.formType === 'stock'); // 是否为入库上架模式
const detailMap = reactive<
  Record<number, MesWmReturnIssueDetailApi.ReturnIssueDetail[]>
>({}); // 已展开行的上架明细缓存
const barcodeDetailRef = ref(); // 条码详情弹窗实例

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
  lineFormModalApi.setData({ issueId: props.issueId }).open();
}

/** 编辑物料 */
function handleEdit(row: MesWmReturnIssueLineApi.ReturnIssueLine) {
  lineFormModalApi.setData({ id: row.id, issueId: props.issueId }).open();
}

/** 删除物料 */
async function handleDelete(row: MesWmReturnIssueLineApi.ReturnIssueLine) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.itemName]),
    duration: 0,
  });
  try {
    await deleteReturnIssueLine(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 上架：直接打开明细创建表单 */
function handlePicking(row: MesWmReturnIssueLineApi.ReturnIssueLine) {
  openDetailForm(row.id!, row.itemId);
}

/** 查看物料条码 */
function handleBarcode(row: MesWmReturnIssueLineApi.ReturnIssueLine) {
  barcodeDetailRef.value?.openByBusiness(
    row.itemId,
    BarcodeBizTypeEnum.ITEM,
    row.itemCode,
    row.itemName,
  );
}

/** 打开上架明细表单 */
function openDetailForm(lineId: number, itemId?: number, detailId?: number) {
  detailFormModalApi
    .setData({ detailId, issueId: props.issueId, itemId, lineId })
    .open();
}

/** 获取已展开行的上架明细 */
function getExpandedDetails(row: MesWmReturnIssueLineApi.ReturnIssueLine) {
  return detailMap[row.id!] || [];
}

/** 加载指定行的上架明细 */
async function loadLineDetails(lineId: number) {
  detailMap[lineId] = await getReturnIssueDetailListByLineId(lineId);
}

/** 展开行时懒加载上架明细 */
async function handleExpandChange(
  row: MesWmReturnIssueLineApi.ReturnIssueLine,
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
          if (!props.issueId) {
            return { list: [], total: 0 };
          }
          return await getReturnIssueLinePage({
            issueId: props.issueId,
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
  } as VxeTableGridOptions<MesWmReturnIssueLineApi.ReturnIssueLine>,
  gridEvents: {
    toggleRowExpand: ({
      expanded,
      row,
    }: {
      expanded: boolean;
      row: MesWmReturnIssueLineApi.ReturnIssueLine;
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
                type: 'link',
                icon: ACTION_ICON.EDIT,
                ifShow: isEditable,
                onClick: handleEdit.bind(null, row),
              },
              {
                label: $t('common.delete'),
                type: 'link',
                danger: true,
                icon: ACTION_ICON.DELETE,
                ifShow: isEditable,
                popConfirm: {
                  title: $t('ui.actionMessage.deleteConfirm', [row.itemName]),
                  confirm: handleDelete.bind(null, row),
                },
              },
              {
                label: '上架',
                type: 'link',
                ifShow: isStock,
                onClick: handlePicking.bind(null, row),
              },
              {
                label: '条码',
                type: 'link',
                onClick: handleBarcode.bind(null, row),
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
    <BarcodeDetail ref="barcodeDetailRef" />
  </div>
</template>
