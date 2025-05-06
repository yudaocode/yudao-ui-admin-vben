<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmProcessListenerApi } from '#/api/bpm/processListener';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProcessListener,
  getProcessListenerPage,
} from '#/api/bpm/processListener';
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
          return await getProcessListenerPage({
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
  } as VxeTableGridOptions<BpmProcessListenerApi.ProcessListenerVO>,
});

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<BpmProcessListenerApi.ProcessListenerVO>) {
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

/** 创建流程监听器 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑流程监听器 */
function onEdit(row: BpmProcessListenerApi.ProcessListenerVO) {
  formModalApi.setData(row).open();
}

/** 删除流程监听器 */
async function onDelete(row: BpmProcessListenerApi.ProcessListenerVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteProcessListener(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
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
    <DocAlert
      title="执行监听器、任务监听器"
      url="https://doc.iocoder.cn/bpm/listener/"
    />
    <FormModal @success="onRefresh" />
    <Grid table-title="流程监听器">
      <template #toolbar-tools>
        <Button
          type="primary"
          @click="onCreate"
          v-access:code="['bpm:process-listener:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['流程监听器']) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
