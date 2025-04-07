<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraFileApi } from '#/api/infra/file';

import { Page, useVbenModal } from '@vben/common-ui';
import { Button, message, Image } from 'ant-design-vue';
import { Upload } from '@vben/icons';
import Form from './modules/form.vue';

import { $t } from '#/locales';
import { useClipboard } from '@vueuse/core';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getFilePage, deleteFile } from '#/api/infra/file';
import { useGridColumns, useGridFormSchema } from './data';

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
async function onCopyUrl(row: InfraFileApi.InfraFile) {
  if (!row.url) {
    message.error('文件 URL 为空');
    return;
  }

  try {
    await copy(row.url);
    message.success('复制成功');
  } catch (error) {
    message.error('复制失败');
  }
}

/** 打开 URL */
function openUrl(url?: string) {
  if (url) {
    window.open(url, '_blank');
  }
}

/** 删除文件 */
async function onDelete(row: InfraFileApi.InfraFile) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name || row.path]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteFile(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name || row.path]),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch (error) {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraFileApi.InfraFile>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'copyUrl': {
      onCopyUrl(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema()
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
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<InfraFileApi.InfraFile>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="文件列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onUpload">
          <Upload class="size-5" />
          上传图片
        </Button>
      </template>
      <template #file-content="{ row }">
        <Image v-if="row.type && row.type.includes('image')" :src="row.url" />
        <Button v-else-if="row.type && row.type.includes('pdf')" type="link" @click="() => openUrl(row.url)"> 预览 </Button>
        <Button v-else type="link" @click="() => openUrl(row.url)"> 下载 </Button>
      </template>
    </Grid>
  </Page>
</template>
