<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraFileApi } from '#/api/infra/file';

import { ref } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { isEmpty, openWindow } from '@vben/utils';

import { useClipboard } from '@vueuse/core';
import { ElButton, ElImage, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteFile, deleteFileList, getFilePage } from '#/api/infra/file';
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
    ElMessage.error('文件 URL 为空');
    return;
  }

  try {
    await copy(row.url);
    ElMessage.success('复制成功');
  } catch {
    ElMessage.error('复制失败');
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
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name || row.path]),
    fullscreen: true,
  });
  try {
    await deleteFile(row.id as number);
    ElMessage.success(
      $t('ui.actionMessage.deleteSuccess', [row.name || row.path]),
    );
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除文件 */
async function onDeleteBatch() {
  await confirm('确定要批量删除该文件吗？');
  await deleteFileList(checkedIds.value);
  checkedIds.value = [];
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  onRefresh();
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: InfraFileApi.File[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
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
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="文件列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '上传图片',
              type: 'primary',
              icon: ACTION_ICON.UPLOAD,
              onClick: onUpload,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['infra:file:delete'],
              onClick: onDeleteBatch,
            },
          ]"
        />
      </template>
      <template #file-content="{ row }">
        <ElImage v-if="row.type && row.type.includes('image')" :src="row.url" />
        <ElButton
          v-else-if="row.type && row.type.includes('pdf')"
          type="primary"
          link
          @click="() => openUrl(row.url)"
        >
          预览
        </ElButton>
        <ElButton v-else type="primary" link @click="() => openUrl(row.url)">
          下载
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
