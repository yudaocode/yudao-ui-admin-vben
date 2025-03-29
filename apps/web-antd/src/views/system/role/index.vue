<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api/system/role';

import { $t } from '#/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getRolePage, deleteRole, exportRole } from '#/api/system/role';

import { Page, useVbenModal } from '@vben/common-ui';
import { Button, message } from 'ant-design-vue';
import { Plus, Download } from '@vben/icons';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import { downloadByData } from '#/utils/download';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 编辑角色 */
function onEdit(row: SystemRoleApi.SystemRole) {
  formModalApi.setData(row).open();
}

/** 创建角色 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 删除角色 */
async function onDelete(row: SystemRoleApi.SystemRole) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteRole(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch (error) {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick(e: OnActionClickParams<SystemRoleApi.SystemRole>) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      onEdit(e.row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    // TODO @芋艿：时间范围的检索
    fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getRolePage({
            page: page.currentPage,
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
  } as VxeTableGridOptions<SystemRoleApi.SystemRole>,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await exportRole(await gridApi.formApi.getValues());
  downloadByData(data, '角色.xls');
}
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="角色列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['角色']) }}
        </Button>
        <Button type="primary" class="ml-2" @click="onExport">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
