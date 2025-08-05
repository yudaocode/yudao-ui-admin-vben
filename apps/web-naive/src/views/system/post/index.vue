<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemPostApi } from '#/api/system/post';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePost, exportPost, getPostPage } from '#/api/system/post';
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
  const data = await exportPost(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '岗位.xls', source: data });
}

/** 创建岗位 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑岗位 */
function onEdit(row: SystemPostApi.Post) {
  formModalApi.setData(row).open();
}

/** 删除岗位 */
async function onDelete(row: SystemPostApi.Post) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deletePost(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<SystemPostApi.Post>) {
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
          return await getPostPage({
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
  } as VxeTableGridOptions<SystemPostApi.Post>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="岗位列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:post:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['岗位']) }}
        </NButton>
        <NButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['system:post:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
