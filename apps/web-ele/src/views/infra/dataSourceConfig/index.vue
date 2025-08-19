<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraDataSourceConfigApi } from '#/api/infra/data-source-config';

import { onMounted, ref } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDataSourceConfig,
  deleteDataSourceConfigList,
  getDataSourceConfigList,
} from '#/api/infra/data-source-config';
import { $t } from '#/locales';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 创建数据源 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑数据源 */
function onEdit(row: InfraDataSourceConfigApi.DataSourceConfig) {
  formModalApi.setData(row).open();
}

/** 删除数据源 */
async function onDelete(row: InfraDataSourceConfigApi.DataSourceConfig) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteDataSourceConfig(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除数据源 */
async function onDeleteBatch() {
  await confirm('确定要批量删除该数据源吗？');
  await deleteDataSourceConfigList(checkedIds.value);
  checkedIds.value = [];
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  onRefresh();
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: InfraDataSourceConfigApi.DataSourceConfig[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraDataSourceConfigApi.DataSourceConfig>) {
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
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    rowConfig: {
      keyField: 'id',
    },
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: getDataSourceConfigList,
      },
    },
  } as VxeTableGridOptions<InfraDataSourceConfigApi.DataSourceConfig>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 加载数据 */
async function handleLoadData() {
  await gridApi.query();
}

/** 刷新表格 */
async function onRefresh() {
  await handleLoadData();
}

/** 初始化 */
onMounted(() => {
  handleLoadData();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="数据源列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['数据源']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['infra:data-source-config:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['infra:data-source-config:delete'],
              onClick: onDeleteBatch,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
