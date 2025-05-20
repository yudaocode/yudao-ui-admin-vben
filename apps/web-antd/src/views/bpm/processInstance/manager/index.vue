<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';

import { h } from 'vue';

import { Page, prompt } from '@vben/common-ui';

import { message, Textarea } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelProcessInstanceByAdmin,
  getProcessInstanceManagerPage,
} from '#/api/bpm/processInstance';
import { DocAlert } from '#/components/doc-alert';
import { router } from '#/router';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'BpmProcessInstanceManager' });

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick, onTaskClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getProcessInstanceManagerPage({
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
  } as VxeTableGridOptions<BpmProcessInstanceApi.ProcessInstanceVO>,
});

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<BpmProcessInstanceApi.ProcessInstanceVO>) {
  switch (code) {
    case 'cancel': {
      onCancel(row);
      break;
    }
    case 'detail': {
      onDetail(row);
      break;
    }
  }
}

/** 点击任务 */
function onTaskClick(task: BpmProcessInstanceApi.Task) {
  // TODO 待实现
  console.warn(task);
}

/** 取消流程实例 */
function onCancel(row: BpmProcessInstanceApi.ProcessInstanceVO) {
  prompt({
    async beforeClose(scope) {
      if (scope.isConfirm) {
        if (scope.value) {
          try {
            await cancelProcessInstanceByAdmin(row.id, scope.value);
            message.success('取消成功');
            onRefresh();
          } catch {
            return false;
          }
        } else {
          message.error('请输入取消原因');
          return false;
        }
      }
    },
    component: () => {
      return h(Textarea, {
        placeholder: '请输入取消原因',
        allowClear: true,
        rows: 2,
        rules: [{ required: true, message: '请输入取消原因' }],
      });
    },
    content: '请输入取消原因',
    title: '取消流程',
    modelPropName: 'value',
  });
}

/** 查看流程实例 */
function onDetail(row: BpmProcessInstanceApi.ProcessInstanceVO) {
  console.warn(row);
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.id },
  });
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="工作流手册" url="https://doc.iocoder.cn/bpm" />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="流程实例" />
  </Page>
</template>
