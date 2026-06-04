<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmReturnVendorDetailApi } from '#/api/mes/wm/returnvendor/detail';
import type { MesWmReturnVendorLineApi } from '#/api/mes/wm/returnvendor/line';

import { computed, reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getReturnVendorDetailListByLineId } from '#/api/mes/wm/returnvendor/detail';
import {
  deleteReturnVendorLine,
  getReturnVendorLinePage,
} from '#/api/mes/wm/returnvendor/line';
import { $t } from '#/locales';
import { PrinterLabel } from '#/views/mes/wm/barcode/components';

import { type FormType, useLineGridColumns } from '../data';
import DetailForm from './detail-form.vue';
import DetailList from './detail-list.vue';
import LineForm from './line-form.vue';

const props = defineProps<{
  formType: FormType;
  returnId: number;
  vendorId?: number;
}>();

const isEditable = computed(() => // 是否可编辑明细行
  ['create', 'update'].includes(props.formType),
);
const isStock = computed(() => props.formType === 'stock'); // 是否为拣货模式
const detailMap = reactive<
  Record<number, MesWmReturnVendorDetailApi.ReturnVendorDetail[]>
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
    .setData({ returnId: props.returnId, vendorId: props.vendorId })
    .open();
}

/** 编辑物料 */
function handleEdit(row: MesWmReturnVendorLineApi.ReturnVendorLine) {
  lineFormModalApi
    .setData({ id: row.id, returnId: props.returnId, vendorId: props.vendorId })
    .open();
}

/** 删除物料 */
async function handleDelete(row: MesWmReturnVendorLineApi.ReturnVendorLine) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.itemName]),
  });
  try {
    await deleteReturnVendorLine(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 拣货：直接打开明细创建表单 */
function handlePicking(row: MesWmReturnVendorLineApi.ReturnVendorLine) {
  openDetailForm(row.id!, row.itemId);
}

/** 打开拣货明细表单 */
function openDetailForm(lineId: number, itemId?: number, detailId?: number) {
  detailFormModalApi
    .setData({ detailId, itemId, lineId, returnId: props.returnId })
    .open();
}

/** 获取已展开行的拣货明细 */
function getExpandedDetails(row: MesWmReturnVendorLineApi.ReturnVendorLine) {
  return detailMap[row.id!] || [];
}

/** 加载指定行的拣货明细 */
async function loadLineDetails(lineId: number) {
  detailMap[lineId] = await getReturnVendorDetailListByLineId(lineId);
}

/** 展开行时懒加载拣货明细 */
async function handleExpandChange(
  row: MesWmReturnVendorLineApi.ReturnVendorLine,
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
          if (!props.returnId) {
            return { list: [], total: 0 };
          }
          return await getReturnVendorLinePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            returnId: props.returnId,
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
  } as VxeTableGridOptions<MesWmReturnVendorLineApi.ReturnVendorLine>,
  gridEvents: {
    toggleRowExpand: ({
      expanded,
      row,
    }: {
      expanded: boolean;
      row: MesWmReturnVendorLineApi.ReturnVendorLine;
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
                label: '拣货',
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
