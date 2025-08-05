<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraFileApi } from '#/api/infra/file';

import { Page, useVbenModal } from '@vben/common-ui';
import { Upload } from '@vben/icons';
import { openWindow } from '@vben/utils';

import { useClipboard } from '@vueuse/core';
import { NButton, NImage } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteFile, getFilePage } from '#/api/infra/file';
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

/** 上传文件 */
function onUpload() {
  formModalApi.setData(null).open();
}

/** 复制链接到剪贴板 */
const { copy } = useClipboard({ legacy: true });
async function onCopyUrl(row: InfraFileApi.File) {
  if (!row.url) {
    message.error('文件 URL 为空');
    return;
  }

  try {
    await copy(row.url);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}

/** 打开 URL */
function openUrl(url?: string) {
  if (url) {
    openWindow(url);
  }
}

/** 删除文件 */
async function onDelete(row: InfraFileApi.File) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name || row.path]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteFile(row.id as number);
    message.success(
      $t('ui.actionMessage.deleteSuccess', [row.name || row.path]),
    );
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<InfraFileApi.File>) {
  switch (code) {
    case 'copyUrl': {
      onCopyUrl(row);
      break;
    }
    case 'delete': {
      onDelete(row);
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
          return await getFilePage({
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
  } as VxeTableGridOptions<InfraFileApi.File>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="文件列表">
      <template #toolbar-tools>
        <NButton type="primary" @click="onUpload">
          <Upload class="size-5" />
          上传图片
        </NButton>
      </template>
      <template #file-content="{ row }">
        <NImage v-if="row.type && row.type.includes('image')" :src="row.url" />
        <NButton
          v-else-if="row.type && row.type.includes('pdf')"
          type="link"
          @click="() => openUrl(row.url)"
        >
          预览
        </NButton>
        <NButton v-else type="link" @click="() => openUrl(row.url)">
          下载
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
