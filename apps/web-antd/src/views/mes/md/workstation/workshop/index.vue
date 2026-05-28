<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdWorkshopApi } from '#/api/mes/md/workstation/workshop';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWorkshop,
  getWorkshopPage,
} from '#/api/mes/md/workstation/workshop';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建车间 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看车间 */
function handleDetail(row: MesMdWorkshopApi.Workshop) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑车间 */
function handleEdit(row: MesMdWorkshopApi.Workshop) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除车间 */
async function handleDelete(row: MesMdWorkshopApi.Workshop) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteWorkshop(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
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
          return await getWorkshopPage({
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
  } as VxeTableGridOptions<MesMdWorkshopApi.Workshop>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【基础】车间设置、工作站设置"
        url="https://doc.iocoder.cn/mes/md/workshop/"
      />
    </template>

    <FormModal @success="handleRefresh" />
    <Grid table-title="车间列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['车间']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:md-workshop:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <Button type="link" @click="handleDetail(row)">
          {{ row.code }}
        </Button>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mes:md-workshop:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:md-workshop:delete'],
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
