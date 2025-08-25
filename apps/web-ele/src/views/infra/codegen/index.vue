<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraCodegenApi } from '#/api/infra/codegen';
import type { InfraDataSourceConfigApi } from '#/api/infra/data-source-config';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCodegenTable,
  deleteCodegenTableList,
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
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.tableName]),
    fullscreen: true,
  });
  try {
    await deleteCodegenTable(row.id);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.tableName]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除代码生成配置 */
async function onDeleteBatch() {
  await confirm('确定要批量删除该代码生成配置吗？');
  await deleteCodegenTableList(checkedIds.value);
  checkedIds.value = [];
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  onRefresh();
}

/** 同步数据库 */
async function onSync(row: InfraCodegenApi.CodegenTable) {
  await confirm('确定要同步该代码生成配置吗？');
  await syncCodegenFromDB(row.id);
  ElMessage.success($t('ui.actionMessage.updateSuccess', [row.tableName]));
  onRefresh();
}

/** 生成代码 */
async function onGenerate(row: InfraCodegenApi.CodegenTable) {
  const loadingInstance = ElLoading.service({
    text: '正在生成代码...',
    fullscreen: true,
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
    ElMessage.success('代码生成成功');
  } finally {
    loadingInstance.close();
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

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: InfraCodegenApi.CodegenTable[];
}) {
  checkedIds.value = records.map((item) => item.id);
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
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
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
        <TableAction
          :actions="[
            {
              label: '导入',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['infra:codegen:create'],
              onClick: onImport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['infra:codegen:delete'],
              onClick: onDeleteBatch,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
