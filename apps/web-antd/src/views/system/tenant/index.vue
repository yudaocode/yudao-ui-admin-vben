<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemTenantApi } from '#/api/system/tenant';
import type { SystemTenantPackageApi } from '#/api/system/tenant-package';

import { onMounted, ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTenant,
  deleteTenantList,
  exportTenant,
  getTenantPage,
} from '#/api/system/tenant';
import { getTenantPackageList } from '#/api/system/tenant-package';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const tenantPackageList = ref<SystemTenantPackageApi.TenantPackage[]>([]);

/** 获取套餐名称 */
const getPackageName = (packageId: number) => {
  if (packageId === 0) {
    return '系统租户';
  }
  return tenantPackageList.value.find((pkg) => pkg.id === packageId)?.name;
};

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportTenant(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '租户.xls', source: data });
}

/** 创建租户 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑租户 */
function handleEdit(row: SystemTenantApi.Tenant) {
  formModalApi.setData(row).open();
}

/** 删除租户 */
async function handleDelete(row: SystemTenantApi.Tenant) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: 'action_key_msg',
  });
  try {
    await deleteTenant(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: SystemTenantApi.Tenant[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 批量删除租户 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteTenantList(checkedIds.value);
    checkedIds.value = [];
    message.success($t('ui.actionMessage.deleteSuccess'));
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
    columns: useGridColumns(getPackageName),
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
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<SystemTenantApi.Tenant>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 初始化 */
onMounted(async () => {
  tenantPackageList.value = await getTenantPackageList();
});
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="SaaS 多租户" url="https://doc.iocoder.cn/saas-tenant/" />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="租户列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['租户']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:tenant:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['system:tenant:export'],
              onClick: handleExport,
            },
            {
              label: '批量删除',
              type: 'primary',
              danger: true,
              disabled: isEmpty(checkedIds),
              icon: ACTION_ICON.DELETE,
              auth: ['system:tenant:delete'],
              onClick: handleDeleteBatch,
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
              auth: ['system:tenant:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:tenant:delete'],
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
