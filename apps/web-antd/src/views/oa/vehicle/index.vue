<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaVehicleApi } from '#/api/oa/vehicle';

import { Page, useVbenModal } from '@vben/common-ui';

import { Image, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteVehicle, getVehiclePage } from '#/api/oa/vehicle';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'OaVehicle' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建车辆 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑车辆 */
function handleEdit(row: OaVehicleApi.Vehicle) {
  formModalApi.setData({ id: row.id }).open();
}

/** 删除车辆 */
async function handleDelete(row: OaVehicleApi.Vehicle) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteVehicle(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
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
          return await getVehiclePage({
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
  } as VxeTableGridOptions<OaVehicleApi.Vehicle>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />

    <Grid table-title="车辆列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['车辆']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:vehicle:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #picUrl="{ row }">
        <Image
          v-if="row.picUrl"
          :src="row.picUrl"
          :width="40"
          :height="40"
          class="object-cover"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:vehicle:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:vehicle:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
