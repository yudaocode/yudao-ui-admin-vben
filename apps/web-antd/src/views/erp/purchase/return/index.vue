<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpPurchaseReturnApi } from '#/api/erp/purchase/return';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePurchaseReturn,
  exportPurchaseReturn,
  getPurchaseReturnPage,
  updatePurchaseReturnStatus,
} from '#/api/erp/purchase/return';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import PurchaseInForm from './modules/purchase-return-form.vue';

/** ERP 采购入库列表 */
defineOptions({ name: 'ErpPurchaseIn' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: PurchaseInForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

const checkedIds = ref<number[]>([]);

/** 详情 */
function handleDetail(row: ErpPurchaseReturnApi.PurchaseReturn) {
  formModalApi.setData({ type: 'detail', id: row.id }).open();
}

/** 新增 */
function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

/** 编辑 */
function handleEdit(row: ErpPurchaseReturnApi.PurchaseReturn) {
  formModalApi.setData({ type: 'edit', id: row.id }).open();
}

/** 删除 */
async function handleDelete(ids: number[]) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deletePurchaseReturn(ids);
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
async function handleUpdateStatus(
  row: ErpPurchaseReturnApi.PurchaseReturn,
  status: number,
) {
  const hideLoading = message.loading({
    content: `确定${status === 20 ? '审批' : '反审批'}该订单吗？`,
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await updatePurchaseReturnStatus({ id: row.id!, status });
    message.success({
      content: `${status === 20 ? '审批' : '反审批'}成功`,
      key: 'action_process_msg',
    });
    onRefresh();
  } catch {
    // 处理错误
  } finally {
    hideLoading();
  }
}

/** 导出 */
async function handleExport() {
  const data = await exportPurchaseReturn(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '采购退货.xls', source: data });
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
          return await getPurchaseReturnPage({
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
  } as VxeTableGridOptions<ErpPurchaseReturnApi.PurchaseReturn>,
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

    <Grid table-title="采购退货列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['采购退货']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['erp:purchase-return:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['erp:purchase-return:export'],
              onClick: handleExport,
            },
            {
              label: '批量删除',
              type: 'primary',
              danger: true,
              disabled: isEmpty(checkedIds),
              icon: ACTION_ICON.DELETE,
              auth: ['erp:purchase-return:delete'],
              popConfirm: {
                title: `是否删除所选中数据？`,
                confirm: () => {
                  const checkboxRecords = gridApi.grid.getCheckboxRecords();
                  if (checkboxRecords.length === 0) {
                    message.warning('请选择要删除的数据');
                    return;
                  }
                  handleDelete(checkboxRecords.map((item) => item.id!));
                },
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
              auth: ['erp:purchase-return:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['erp:purchase-return:update'],
              ifShow: () => row.status !== 20,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: row.status === 10 ? '审批' : '反审批',
              type: 'link',
              auth: ['erp:purchase-return:update-status'],
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
              auth: ['erp:purchase-return:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.no]),
                confirm: () => handleDelete([row.id!]),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
