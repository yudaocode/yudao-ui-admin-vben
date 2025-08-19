<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraFileConfigApi } from '#/api/infra/file-config';

import { ref } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { isEmpty, openWindow } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteFileConfig,
  deleteFileConfigList,
  getFileConfigPage,
  testFileConfig,
  updateFileConfigMaster,
} from '#/api/infra/file-config';
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

/** 创建文件配置 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑文件配置 */
function onEdit(row: InfraFileConfigApi.FileConfig) {
  formModalApi.setData(row).open();
}

/** 设为主配置 */
async function onMaster(row: InfraFileConfigApi.FileConfig) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.updating', [row.name]),
    fullscreen: true,
  });
  try {
    await updateFileConfigMaster(row.id as number);
    loadingInstance.close();
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    onRefresh();
  } catch {
    loadingInstance.close();
  }
}

/** 测试文件配置 */
async function onTest(row: InfraFileConfigApi.FileConfig) {
  const loadingInstance = ElLoading.service({
    text: '测试上传中...',
    fullscreen: true,
  });
  try {
    const response = await testFileConfig(row.id as number);
    loadingInstance.close();
    // 确认是否访问该文件
    confirm({
      title: '测试上传成功',
      content: '是否要访问该文件？',
      confirmText: '访问',
      cancelText: '取消',
    }).then(() => {
      openWindow(response);
    });
  } catch {
    loadingInstance.close();
  }
}

/** 删除文件配置 */
async function onDelete(row: InfraFileConfigApi.FileConfig) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteFileConfig(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除文件配置 */
async function onDeleteBatch() {
  await confirm('确定要批量删除该文件配置吗？');
  await deleteFileConfigList(checkedIds.value);
  checkedIds.value = [];
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  onRefresh();
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: InfraFileConfigApi.FileConfig[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraFileConfigApi.FileConfig>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'master': {
      onMaster(row);
      break;
    }
    case 'test': {
      onTest(row);
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
          return await getFileConfigPage({
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
  } as VxeTableGridOptions<InfraFileConfigApi.FileConfig>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="文件配置列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['文件配置']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['infra:file-config:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['infra:file-config:delete'],
              onClick: onDeleteBatch,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
