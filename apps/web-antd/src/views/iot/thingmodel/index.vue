<script lang="ts" setup>
import type { Ref } from 'vue';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IotProductApi } from '#/api/iot/product/product';
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed, inject } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { IOT_PROVIDE_KEY } from '@vben/constants';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteThingModel, getThingModelPage } from '#/api/iot/thingmodel';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import { DataDefinition } from './modules/components';
import Form from './modules/form.vue';
import Tsl from './modules/tsl.vue';

const product = inject<Ref<IotProductApi.Product>>(IOT_PROVIDE_KEY.PRODUCT);
const productId = computed(() => product?.value?.id);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [TslModal, tslModalApi] = useVbenModal({
  connectedComponent: Tsl,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增物模型 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑物模型 */
function handleEdit(row: ThingModelApi.ThingModel) {
  formModalApi.setData({ id: row.id }).open();
}

/** 删除物模型 */
async function handleDelete(row: ThingModelApi.ThingModel) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteThingModel(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 打开 TSL 弹窗 */
function handleOpenTsl() {
  tslModalApi.open();
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
          return await getThingModelPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            productId: productId.value,
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
  } as VxeTableGridOptions<ThingModelApi.ThingModel>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <TslModal />

    <Grid table-title="物模型列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['物模型']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['iot:thing-model:create'],
              onClick: handleCreate,
            },
            {
              label: 'TSL',
              type: 'primary',
              auth: ['iot:thing-model:query'],
              onClick: handleOpenTsl,
            },
          ]"
        />
      </template>
      <template #dataDefinition="{ row }">
        <DataDefinition :data="row" />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['iot:thing-model:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['iot:thing-model:delete'],
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
