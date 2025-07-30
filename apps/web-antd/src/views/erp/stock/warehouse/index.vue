<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpWarehouseApi } from '#/api/erp/stock/warehouse';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message, Switch } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWarehouse,
  exportWarehouse,
  getWarehousePage,
  updateWarehouseDefaultStatus,
} from '#/api/erp/stock/warehouse';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import WarehouseForm from './modules/form.vue';

/** 仓库管理 */
defineOptions({ name: 'ErpWarehouse' });

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 添加仓库 */
function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

/** 编辑仓库 */
function handleEdit(row: ErpWarehouseApi.Warehouse) {
  formModalApi.setData({ type: 'update', id: row.id }).open();
}

/** 删除仓库 */
async function handleDelete(row: ErpWarehouseApi.Warehouse) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: 'action_key_msg',
  });
  try {
    await deleteWarehouse(row.id!);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_key_msg',
    });
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 修改默认状态 */
async function handleDefaultStatusChange(row: ErpWarehouseApi.Warehouse) {
  try {
    const text = row.defaultStatus ? '设置' : '取消';
    await message.confirm({
      title: '确认',
      content: `确认要${text}"${row.name}"默认吗?`,
    });
    await updateWarehouseDefaultStatus(row.id!, row.defaultStatus);
    message.success(`${text}默认状态成功`);
    onRefresh();
  } catch {
    // 取消后，进行恢复按钮
    row.defaultStatus = !row.defaultStatus;
  }
}

/** 导出仓库 */
async function handleExport() {
  const data = await exportWarehouse(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '仓库.xls', source: data });
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: WarehouseForm,
  destroyOnClose: true,
});

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
          return await getWarehousePage({
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
  } as VxeTableGridOptions<ErpWarehouseApi.Warehouse>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【库存】产品库存、库存明细"
        url="https://doc.iocoder.cn/erp/stock/"
      />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="仓库列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['仓库']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['erp:warehouse:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['erp:warehouse:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>

      <template #defaultStatus="{ row }">
        <Switch
          v-model:checked="row.defaultStatus"
          @change="handleDefaultStatusChange(row)"
        />
      </template>

      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['erp:warehouse:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['erp:warehouse:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
