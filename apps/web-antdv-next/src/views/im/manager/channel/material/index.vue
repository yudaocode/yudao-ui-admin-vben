<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerChannelMaterialApi } from '#/api/im/manager/channel/material';

import { Page, useVbenModal } from '@vben/common-ui';

import { Image, message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteManagerChannelMaterial,
  getManagerChannelMaterialPage,
} from '#/api/im/manager/channel/material';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'ImManagerChannelMaterial' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建素材 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑素材 */
function handleEdit(row: ImManagerChannelMaterialApi.Material) {
  formModalApi.setData(row).open();
}

/** 删除素材 */
async function handleDelete(row: ImManagerChannelMaterialApi.Material) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.title]),
    duration: 0,
  });
  try {
    await deleteManagerChannelMaterial(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
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
          return await getManagerChannelMaterialPage({
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
  } as VxeTableGridOptions<ImManagerChannelMaterialApi.Material>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <Grid table-title="素材列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['素材']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['im:manager:channel-material:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #cover="{ row }">
        <Image
          v-if="row.coverUrl"
          :height="40"
          :src="row.coverUrl"
          :width="40"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['im:manager:channel-material:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['im:manager:channel-material:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.title]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
