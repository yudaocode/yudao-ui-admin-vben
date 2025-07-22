<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PurchaseOrderApi } from '#/api/erp/purchase/order';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePurchaseOrderList,
  exportPurchaseOrder,
  getPurchaseOrderPage,
  updatePurchaseOrderStatus,
} from '#/api/erp/purchase/order';
import { $t } from '#/locales';

import PurchaseOrderForm from './components/PurchaseOrderForm.vue';
import { useGridColumns, useGridFormSchema } from './data';

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

const { push } = useRouter();

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: PurchaseOrderApi.PurchaseOrder[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

/** 详情 */
function handleDetail(row: PurchaseOrderApi.PurchaseOrder) {
  push({ name: 'ErpPurchaseOrderDetail', params: { id: row.id } });
}

/** 新增 */
function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

/** 编辑 */
function handleEdit(row: PurchaseOrderApi.PurchaseOrder) {
  formModalApi.setData({ type: 'edit', id: row.id }).open();
}

/** 删除 */
function handleDelete(row: PurchaseOrderApi.PurchaseOrder) {
  handleBatchDelete([row.id]);
}

/** 批量删除 */
async function handleBatchDelete() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deletePurchaseOrderList(checkedIds.value);
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
  row: PurchaseOrderApi.PurchaseOrder,
  status: number,
) {
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
  try {
    const formValues = gridApi.getFormData();
    const data = await exportPurchaseOrder(formValues);
    downloadFileFromBlobPart({ fileName: '采购订单.xls', source: data });
  } catch {
    // 处理错误
  }
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
  } as VxeTableGridOptions<PurchaseOrderApi.PurchaseOrder>,
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
              onClick: handleBatchDelete,
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
              onClick: handleUpdateStatus.bind(
                null,
                row,
                row.status === 10 ? 20 : 10,
              ),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              color: 'error',
              auth: ['erp:purchase-order:delete'],
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
