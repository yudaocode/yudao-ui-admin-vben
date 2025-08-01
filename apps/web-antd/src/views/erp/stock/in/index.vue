<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpStockInApi } from '#/api/erp/stock/in';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteStockIn,
  exportStockIn,
  getStockInPage,
  updateStockInStatus,
} from '#/api/erp/stock/in';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import StockInForm from './modules/form.vue';

/** 其它入库单管理 */
defineOptions({ name: 'ErpStockIn' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: StockInForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出入库单 */
async function handleExport() {
  const data = await exportStockIn(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '其它入库单.xls', source: data });
}

/** 新增/编辑/详情 */
function openForm(type: string, id?: number) {
  formModalApi.setData({ type, id }).open();
}

/** 删除 */
async function handleDelete(ids: any[]) {
  const hideLoading = message.loading({
    content: '删除中...',
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteStockIn(ids);
    message.success({
      content: '删除成功',
      key: 'action_process_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 审核/反审核 */
async function handleUpdateStatus(id: any, status: number) {
  const statusText = status === 20 ? '审核' : '反审核';
  const hideLoading = message.loading({
    content: `${statusText}中...`,
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await updateStockInStatus({ id, status });
    message.success({
      content: `${statusText}成功`,
      key: 'action_process_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
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
          return await getStockInPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
    checkboxConfig: {
      reserve: true,
    },
  } as VxeTableGridOptions<ErpStockInApi.StockIn>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【库存】其它入库、其它出库"
        url="https://doc.iocoder.cn/erp/stock-in-out/"
      />
    </template>

    <Grid table-title="其它入库单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['其它入库']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['erp:stock-in:create'],
              onClick: () => openForm('create'),
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'default',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['erp:stock-in:export'],
              onClick: handleExport,
            },
            {
              label: '批量删除',
              type: 'default',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['erp:stock-in:delete'],
              popConfirm: {
                title: '是否删除所选中数据？',
                confirm: () => {
                  const checkboxRecords = gridApi.grid.getCheckboxRecords();
                  if (checkboxRecords.length === 0) {
                    message.warning('请选择要删除的数据');
                    return;
                  }
                  handleDelete(checkboxRecords.map((item) => item.id));
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
              label: '详情',
              icon: ACTION_ICON.VIEW,
              auth: ['erp:stock-in:query'],
              onClick: () => openForm('detail', row.id),
            },
            {
              label: '编辑',
              auth: ['erp:stock-in:update'],
              icon: ACTION_ICON.EDIT,
              disabled: row.status !== 10,
              onClick: () => openForm('update', row.id),
            },
            {
              label: '审核',
              auth: ['erp:stock-in:update'],
              ifShow: row.status === 10,
              popConfirm: {
                title: '确认要审核该入库单吗？',
                confirm: () => handleUpdateStatus(row.id, 20),
              },
            },
            {
              label: '反审核',
              danger: true,
              auth: ['erp:stock-in:update'],
              ifShow: row.status === 20,
              popConfirm: {
                title: '确认要反审核该入库单吗？',
                confirm: () => handleUpdateStatus(row.id, 10),
              },
            },
            {
              label: '删除',
              danger: true,
              auth: ['erp:stock-in:delete'],
              disabled: row.status !== 10,
              popConfirm: {
                title: '确认要删除该入库单吗？',
                confirm: () => handleDelete([row.id]),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 表单弹窗 -->
    <FormModal @success="onRefresh" />
  </Page>
</template>
