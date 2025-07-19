<script lang="ts" setup>
// TODO @xingyu：跑不通
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraCodegenApi } from '#/api/infra/codegen';
import type { InfraDataSourceConfigApi } from '#/api/infra/data-source-config';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCodegenTable,
  downloadCodegen,
  getCodegenTablePage,
  syncCodegenFromDB,
} from '#/api/infra/codegen';
import { getDataSourceConfigList } from '#/api/infra/data-source-config';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import ImportTable from './modules/import-table.vue';
import PreviewCode from './modules/preview-code.vue';

const router = useRouter();
const dataSourceConfigList = ref<InfraDataSourceConfigApi.DataSourceConfig[]>(
  [],
);

/** 获取数据源名称 */
const getDataSourceConfigName = (dataSourceConfigId: number) => {
  return dataSourceConfigList.value.find(
    (item) => item.id === dataSourceConfigId,
  )?.name;
};

const [ImportModal, importModalApi] = useVbenModal({
  connectedComponent: ImportTable,
  destroyOnClose: true,
});

const [PreviewModal, previewModalApi] = useVbenModal({
  connectedComponent: PreviewCode,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导入表格 */
function onImport() {
  importModalApi.open();
}

/** 预览代码 */
function onPreview(row: InfraCodegenApi.CodegenTable) {
  previewModalApi.setData(row).open();
}

/** 编辑表格 */
function onEdit(row: InfraCodegenApi.CodegenTable) {
  router.push({ name: 'InfraCodegenEdit', query: { id: row.id } });
}

/** 删除代码生成配置 */
async function onDelete(row: InfraCodegenApi.CodegenTable) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.tableName]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteCodegenTable(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.tableName]));
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 同步数据库 */
async function onSync(row: InfraCodegenApi.CodegenTable) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.updating', [row.tableName]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await syncCodegenFromDB(row.id);
    message.success($t('ui.actionMessage.updateSuccess', [row.tableName]));
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 生成代码 */
async function onGenerate(row: InfraCodegenApi.CodegenTable) {
  const hideLoading = message.loading({
    content: '正在生成代码...',
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    const res = await downloadCodegen(row.id);
    const blob = new Blob([res], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codegen-${row.className}.zip`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success('代码生成成功');
  } finally {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraCodegenApi.CodegenTable>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'generate': {
      onGenerate(row);
      break;
    }
    case 'preview': {
      onPreview(row);
      break;
    }
    case 'sync': {
      onSync(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick, getDataSourceConfigName),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getCodegenTablePage({
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<InfraCodegenApi.CodegenTable>,
});

/** 获取数据源配置列表 */
async function initDataSourceConfig() {
  try {
    dataSourceConfigList.value = await getDataSourceConfigList();
  } catch (error) {
    console.error('获取数据源配置失败', error);
  }
}

/** 初始化 */
initDataSourceConfig();
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="代码生成（单表）"
        url="https://doc.iocoder.cn/new-feature/"
      />
      <DocAlert
        title="代码生成（树表）"
        url="https://doc.iocoder.cn/new-feature/tree/"
      />
      <DocAlert
        title="代码生成（主子表）"
        url="https://doc.iocoder.cn/new-feature/master-sub/"
      />
      <DocAlert title="单元测试" url="https://doc.iocoder.cn/unit-test/" />
    </template>

    <ImportModal @success="onRefresh" />
    <PreviewModal />
    <Grid table-title="代码生成列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onImport"
          v-access:code="['infra:codegen:create']"
        >
          <Plus class="size-5" />
          导入
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
