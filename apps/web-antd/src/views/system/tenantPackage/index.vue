<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemTenantPackageApi } from '#/api/system/tenant-package';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTenantPackage,
  getTenantPackagePage,
} from '#/api/system/tenant-package';
import { DocAlert } from '#/components/doc-alert';
import { ACTION_KEY, TableAction } from '#/components/table-action';
import { $t } from '#/locales';

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

/** 创建租户套餐 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑租户套餐 */
function onEdit(row: SystemTenantPackageApi.TenantPackage) {
  formModalApi.setData(row).open();
}

/** 删除租户套餐 */
async function onDelete(row: SystemTenantPackageApi.TenantPackage) {
  message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: ACTION_KEY,
  });
  await deleteTenantPackage(row.id as number);
  message.success({
    content: $t('ui.actionMessage.deleteSuccess', [row.name]),
    key: ACTION_KEY,
  });
  onRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    // TODO @芋艿：时间筛选，后续处理；
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getTenantPackagePage({
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
  } as VxeTableGridOptions<SystemTenantPackageApi.TenantPackage>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="SaaS 多租户" url="https://doc.iocoder.cn/saas-tenant/" />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="租户套餐列表">
      <template #toolbar-tools>
        <Button
          type="primary"
          @click="onCreate"
          v-access:code="['system:tenant-package:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['套餐']) }}
        </Button>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: 'ant-design:edit-outlined',
              auth: ['system:role:update'],
              onClick: onEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: 'ant-design:delete-outlined',
              auth: ['system:role:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: onDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
