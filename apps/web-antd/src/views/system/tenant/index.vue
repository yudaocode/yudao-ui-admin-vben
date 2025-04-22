<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemTenantApi } from '#/api/system/tenant';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTenant, exportTenant, getTenantPage } from '#/api/system/tenant';
import { DocAlert } from '#/components/doc-alert';
import { $t } from '#/locales';
import { downloadByData } from '#/utils/download';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await exportTenant(await gridApi.formApi.getValues());
  downloadByData(data, '租户.xls');
}

/** 创建租户 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑租户 */
function onEdit(row: SystemTenantApi.SystemTenant) {
  formModalApi.setData(row).open();
}

/** 删除租户 */
async function onDelete(row: SystemTenantApi.SystemTenant) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteTenant(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemTenantApi.SystemTenant>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getTenantPage({
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
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SystemTenantApi.SystemTenant>,
});
</script>
<template>
  <Page auto-content-height>
    <DocAlert title="SaaS 多租户" url="https://doc.iocoder.cn/saas-tenant/" />

    <FormModal @success="onRefresh" />
    <Grid table-title="租户列表">
      <template #toolbar-tools>
        <Button
          type="primary"
          @click="onCreate"
          v-access:code="['system:tenant:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['租户']) }}
        </Button>
        <Button
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['system:tenant:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
