<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AlertConfigApi } from '#/api/iot/alert/config';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAlertConfig, getAlertConfigPage } from '#/api/iot/alert/config';
import { $t } from '#/locales';

import AlertConfigForm from './modules/form.vue';
import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'IoTAlertConfig' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: AlertConfigForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建告警配置 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑告警配置 */
function handleEdit(row: AlertConfigApi.AlertConfig) {
  formModalApi.setData(row).open();
}

/** 删除告警配置 */
async function handleDelete(row: AlertConfigApi.AlertConfig) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteAlertConfig(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
    });
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
          return await getAlertConfigPage({
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
  } as VxeTableGridOptions<AlertConfigApi.AlertConfig>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <Grid table-title="告警配置列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['告警配置']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['iot:alert-config:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <!-- TODO DONE @AI：接收类型是 number[] 多 Tag，CellDict 只能渲染单值，保留 slot -->
      <template #receiveTypes="{ row }">
        <Tag
          v-for="(type, index) in row.receiveTypes"
          :key="index"
          class="mr-1"
        >
          {{ getDictLabel(DICT_TYPE.IOT_ALERT_RECEIVE_TYPE, type) }}
        </Tag>
      </template>
      <!-- 操作列 -->
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['iot:alert-config:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['iot:alert-config:delete'],
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
