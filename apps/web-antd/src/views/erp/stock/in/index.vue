<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpStockInApi } from '#/api/erp/stock/in';

import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message, Modal } from 'ant-design-vue';

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

const formRef = ref();

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
  formRef.value?.modalApi.open({ type, id });
}

/** 删除 */
function handleDelete(ids: any[]) {
  Modal.confirm({
    title: '系统提示',
    content: `是否确认删除编号为 ${ids.join(',')} 的其它入库单？`,
    onOk: async () => {
      await deleteStockIn(ids);
      message.success('删除成功');
      onRefresh();
    },
  });
}

/** 审核/反审核 */
function handleUpdateStatus(id: any, status: number) {
  const statusText = status === 20 ? '审核' : '反审核';
  Modal.confirm({
    title: '系统提示',
    content: `确认要${statusText}该入库单吗？`,
    onOk: async () => {
      await updateStockInStatus({ id, status });
      message.success(`${statusText}成功`);
      onRefresh();
    },
  });
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
              onClick: () => {
                const checkboxRecords = gridApi.grid.getCheckboxRecords();
                if (checkboxRecords.length === 0) {
                  message.warning('请选择要删除的数据');
                  return;
                }
                handleDelete(checkboxRecords.map((item) => item.id));
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
              auth: ['erp:stock-in:query'],
              onClick: () => openForm('detail', row.id),
            },
            {
              label: '编辑',
              type: 'primary',
              auth: ['erp:stock-in:update'],
              ifShow: row.status === 10,
              onClick: () => openForm('update', row.id),
            },
            {
              label: '审核',
              type: 'primary',
              auth: ['erp:stock-in:update'],
              ifShow: row.status === 10,
              onClick: () => handleUpdateStatus(row.id, 20),
            },
            {
              label: '反审核',
              danger: true,
              auth: ['erp:stock-in:update'],
              ifShow: row.status === 20,
              onClick: () => handleUpdateStatus(row.id, 10),
            },
            {
              label: '删除',
              danger: true,
              auth: ['erp:stock-in:delete'],
              ifShow: row.status === 10,
              onClick: () => handleDelete([row.id]),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 表单弹窗 -->
    <StockInForm ref="formRef" @success="onRefresh" />
  </Page>
</template>
