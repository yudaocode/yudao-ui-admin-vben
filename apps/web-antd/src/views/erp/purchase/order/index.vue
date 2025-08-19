<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpPurchaseOrderApi } from '#/api/erp/purchase/order';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePurchaseOrder,
  deletePurchaseOrderList,
  exportPurchaseOrder,
  getPurchaseOrderPage,
  updatePurchaseOrderStatus,
} from '#/api/erp/purchase/order';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import PurchaseOrderForm from './modules/form.vue';

/** ERP 采购订单列表 */
defineOptions({ name: 'ErpPurchaseOrder' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: PurchaseOrderForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

// TODO @nehc handleRowCheckboxChange 放的位置；
const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: ErpPurchaseOrderApi.PurchaseOrder[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

/** 详情 */
function handleDetail(row: ErpPurchaseOrderApi.PurchaseOrder) {
  formModalApi.setData({ type: 'detail', id: row.id }).open();
}

/** 新增 */
function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

/** 编辑 */
function handleEdit(row: ErpPurchaseOrderApi.PurchaseOrder) {
  formModalApi.setData({ type: 'edit', id: row.id }).open();
}

/** 删除 */
async function handleDelete(row: ErpPurchaseOrderApi.PurchaseOrder) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    if (row.id) await deletePurchaseOrder(row.id);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess'),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch {
    // 处理错误
  } finally {
    hideLoading();
  }
}

/** 批量删除 */
// TODO @nehc handleBatchDelete 是不是和别的模块，一个风格
async function handleBatchDelete() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deletePurchaseOrderList(checkedIds.value);
    checkedIds.value = [];
    message.success({
      content: $t('ui.actionMessage.deleteSuccess'),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch {
    // 处理错误
  } finally {
    hideLoading();
  }
}

/** 审批/反审批操作 */
function handleUpdateStatus(
  row: ErpPurchaseOrderApi.PurchaseOrder,
  status: number,
) {
  // TODO @nehc 是不是和别的模块，类似的 status 处理一个风格
  const hideLoading = message.loading({
    content: `确定${status === 20 ? '审批' : '反审批'}该订单吗？`,
    duration: 0,
    key: 'action_process_msg',
  });
  updatePurchaseOrderStatus(row.id, status)
    .then(() => {
      message.success({
        content: `${status === 20 ? '审批' : '反审批'}成功`,
        key: 'action_process_msg',
      });
      onRefresh();
    })
    .catch(() => {
      // 处理错误
    })
    .finally(() => {
      hideLoading();
    });
}

/** 导出 */
async function handleExport() {
  const data = await exportPurchaseOrder(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '采购订单.xls', source: data });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getPurchaseOrderPage({
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
  } as VxeTableGridOptions<ErpPurchaseOrderApi.PurchaseOrder>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【采购】采购订单、入库、退货"
        url="https://doc.iocoder.cn/erp/purchase/"
      />
    </template>

    <FormModal @success="onRefresh" />

    <Grid table-title="采购订单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['采购订单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['erp:purchase-order:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['erp:purchase-order:export'],
              onClick: handleExport,
            },
            {
              label: '批量删除',
              type: 'primary',
              danger: true,
              disabled: isEmpty(checkedIds),
              icon: ACTION_ICON.DELETE,
              auth: ['erp:purchase-order:delete'],
              popConfirm: {
                title: `是否删除所选中数据？`,
                confirm: handleBatchDelete,
              },
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['erp:purchase-order:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['erp:purchase-order:update'],
              ifShow: () => row.status !== 20,
              onClick: handleEdit.bind(null, row),
            },
          ]"
          :drop-down-actions="[
            {
              label: row.status === 10 ? '审批' : '反审批',
              type: 'link',
              auth: ['erp:purchase-order:update-status'],
              popConfirm: {
                title: `确认${row.status === 10 ? '审批' : '反审批'}${row.no}吗？`,
                confirm: handleUpdateStatus.bind(
                  null,
                  row,
                  row.status === 10 ? 20 : 10,
                ),
              },
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              color: 'error',
              auth: ['erp:purchase-order:delete'],
              onClick: handleDelete.bind(null, row),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.no]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
