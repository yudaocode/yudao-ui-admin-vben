<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraFileConfigApi } from '#/api/infra/file-config';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { openWindow } from '@vben/utils';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteFileConfig,
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
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.updating', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await updateFileConfigMaster(row.id as number);
    message.success($t('ui.actionMessage.operationSuccess'));
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 测试文件配置 */
async function onTest(row: InfraFileConfigApi.FileConfig) {
  const hideLoading = message.loading({
    content: '测试上传中...',
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    const response = await testFileConfig(row.id as number);
    hideLoading();
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
    hideLoading();
  }
}

/** 删除文件配置 */
async function onDelete(row: InfraFileConfigApi.FileConfig) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteFileConfig(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    hideLoading();
  }
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
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="文件配置列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['infra:file-config:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['文件配置']) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
