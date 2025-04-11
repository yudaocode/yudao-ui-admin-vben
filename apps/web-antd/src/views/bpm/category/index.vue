<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { CategoryApi } from '#/api/bpm/category/index';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteCategory, getCategoryPage } from '#/api/bpm/category/index';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
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
          return await getCategoryPage({
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
  } as VxeTableGridOptions<CategoryApi.CategoryVO>,
});

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<CategoryApi.CategoryVO>) {
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

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建流程分类 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑流程分类 */
function onEdit(row: CategoryApi.CategoryVO) {
  formModalApi.setData(row).open();
}

/** 删除流程分类 */
async function onDelete(row: CategoryApi.CategoryVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteCategory(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.code]),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch {
    hideLoading();
  }
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="流程分类">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['流程分类']) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
