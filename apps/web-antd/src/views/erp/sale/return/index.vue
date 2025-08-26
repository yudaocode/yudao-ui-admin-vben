<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpSaleReturnApi } from '#/api/erp/sale/return';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSaleReturn,
  exportSaleReturn,
  getSaleReturnPage,
  updateSaleReturnStatus,
} from '#/api/erp/sale/return';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import SaleReturnForm from './modules/sale-return-form.vue';

/** ERP 销售退货列表 */
defineOptions({ name: 'ErpSaleReturn' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: SaleReturnForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: ErpSaleReturnApi.SaleReturn[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 详情 */
function handleDetail(row: ErpSaleReturnApi.SaleReturn) {
  formModalApi.setData({ type: 'detail', id: row.id }).open();
}

/** 新增 */
function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

/** 编辑 */
function handleEdit(row: ErpSaleReturnApi.SaleReturn) {
  formModalApi.setData({ type: 'update', id: row.id }).open();
}

/** 删除 */
async function handleDelete(ids: number[]) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteSaleReturn(ids);
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
function handleUpdateStatus(row: ErpSaleReturnApi.SaleReturn, status: number) {
  const hideLoading = message.loading({
    content: `确定${status === 20 ? '审批' : '反审批'}该订单吗？`,
    duration: 0,
    key: 'action_process_msg',
  });
  updateSaleReturnStatus({ id: row.id!, status })
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
  const data = await exportSaleReturn(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '销售退货.xls', source: data });
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
          return await getSaleReturnPage({
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
  } as VxeTableGridOptions<ErpSaleReturnApi.SaleReturn>,
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
        title="【销售】销售订单、出库、退货"
        url="https://doc.iocoder.cn/erp/sale/"
      />
    </template>
    <FormModal @success="onRefresh" />

    <Grid table-title="销售退货列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['销售退货']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['erp:sale-return:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['erp:sale-return:export'],
              onClick: handleExport,
            },
            {
              label: '批量删除',
              type: 'primary',
              danger: true,
              disabled: isEmpty(checkedIds),
              icon: ACTION_ICON.DELETE,
              auth: ['erp:sale-return:delete'],
              popConfirm: {
                disabled: isEmpty(checkedIds),
                title: `是否删除所选中数据？`,
                confirm: () => {
                  handleDelete(checkedIds);
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
              auth: ['erp:sale-return:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['erp:sale-return:update'],
              ifShow: () => row.status !== 20,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: row.status === 10 ? '审批' : '反审批',
              type: 'link',
              auth: ['erp:sale-return:update-status'],
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
              auth: ['erp:sale-return:delete'],
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
