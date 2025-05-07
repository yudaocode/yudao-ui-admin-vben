<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmProcessExpressionApi } from '#/api/bpm/processExpression';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProcessExpression,
  getProcessExpressionPage,
} from '#/api/bpm/processExpression';
import { DocAlert } from '#/components/doc-alert';
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
          return await getProcessExpressionPage({
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
  } as VxeTableGridOptions<BpmProcessExpressionApi.ProcessExpressionVO>,
});

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<BpmProcessExpressionApi.ProcessExpressionVO>) {
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

/** 创建流程表达式 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑流程表达式 */
function onEdit(row: BpmProcessExpressionApi.ProcessExpressionVO) {
  formModalApi.setData(row).open();
}

/** 删除流程表达式 */
async function onDelete(row: BpmProcessExpressionApi.ProcessExpressionVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });

  try {
    await deleteProcessExpression(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    hideLoading();
  }
}
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="流程表达式" url="https://doc.iocoder.cn/bpm/expression/" />

    <FormModal @success="onRefresh" />
    <Grid table-title="流程表达式">
      <template #toolbar-tools>
        <Button
          type="primary"
          @click="onCreate"
          v-access:code="['bpm:process-expression:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['流程表达式']) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
