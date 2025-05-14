<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraConfigApi } from '#/api/infra/config';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteConfig, exportConfig, getConfigPage } from '#/api/infra/config';
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

/** 导出表格 */
async function onExport() {
  const data = await exportConfig(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '参数配置.xls', source: data });
}

/** 创建参数 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑参数 */
function onEdit(row: InfraConfigApi.Config) {
  formModalApi.setData(row).open();
}

/** 删除参数 */
async function onDelete(row: InfraConfigApi.Config) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteConfig(row.id as number);
    loadingInstance.close();
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    loadingInstance.close();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraConfigApi.Config>) {
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
          return await getConfigPage({
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
  } as VxeTableGridOptions<InfraConfigApi.Config>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="参数列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['infra:config:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['参数']) }}
        </ElButton>
        <ElButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:config:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
