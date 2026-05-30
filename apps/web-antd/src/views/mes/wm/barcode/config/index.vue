<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmBarcodeConfigApi } from '#/api/mes/wm/barcode/config';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteBarcodeConfig,
  getBarcodeConfigPage,
  updateBarcodeConfig,
} from '#/api/mes/wm/barcode/config';
import { $t } from '#/locales';

import { useConfigGridColumns, useConfigGridFormSchema } from '../data';
import ConfigForm from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ConfigForm,
  destroyOnClose: true,
});

/** 自动生成开关变更 */
async function handleAutoGenerateChange(
  row: MesWmBarcodeConfigApi.BarcodeConfig,
): Promise<boolean> {
  const text = row.autoGenerateFlag ? '启用' : '停用';
  try {
    await confirm(`确认要${text}自动生成吗？`);
  } catch {
    return false;
  }
  await updateBarcodeConfig(row);
  message.success(`${text}成功`);
  return true;
}

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建条码配置 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑条码配置 */
function handleEdit(row: MesWmBarcodeConfigApi.BarcodeConfig) {
  formModalApi.setData(row).open();
}

/** 删除条码配置 */
async function handleDelete(row: MesWmBarcodeConfigApi.BarcodeConfig) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.contentFormat || `#${row.id}`]),
    duration: 0,
  });
  try {
    await deleteBarcodeConfig(row.id!);
    message.success(
      $t('ui.actionMessage.deleteSuccess', [row.contentFormat || `#${row.id}`]),
    );
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useConfigGridFormSchema(),
  },
  gridOptions: {
    columns: useConfigGridColumns(handleAutoGenerateChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getBarcodeConfigPage({
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
  } as VxeTableGridOptions<MesWmBarcodeConfigApi.BarcodeConfig>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】仓库与库区库位、条码赋码、SN码"
        url="https://doc.iocoder.cn/mes/wm/warehouse-setup/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="条码配置列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['条码配置']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-barcode-config:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mes:wm-barcode-config:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-barcode-config:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  row.contentFormat || `#${row.id}`,
                ]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
