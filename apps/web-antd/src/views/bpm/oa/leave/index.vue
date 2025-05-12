<script lang="ts" setup>
import type { PageParam } from '@vben/request';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmOALeaveApi } from '#/api/bpm/oa/leave';

import { h } from 'vue';

import { Page, prompt } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Textarea } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLeavePage } from '#/api/bpm/oa/leave';
import { cancelProcessInstanceByStartUser } from '#/api/bpm/processInstance';
import { DocAlert } from '#/components/doc-alert';
import { router } from '#/router';

import { GridFormSchema, useGridColumns } from './data';

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: GridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }: PageParam, formValues: any) => {
          return await getLeavePage({
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
  } as VxeTableGridOptions<BpmOALeaveApi.LeaveVO>,
});

/** 创建请假 */
function onCreate() {
  router.push({
    name: 'OALeaveCreate',
    query: {
      formType: 'create',
    },
  });
}

/** 查看请假详情 */
const onDetail = (row: BpmOALeaveApi.LeaveVO) => {
  router.push({
    name: 'OALeaveDetail',
    query: { id: row.id },
  });
};

/** 取消请假 */
const onCancel = (row: BpmOALeaveApi.LeaveVO) => {
  prompt({
    async beforeClose(scope) {
      if (scope.isConfirm) {
        if (scope.value) {
          try {
            await cancelProcessInstanceByStartUser(row.id, scope.value);
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
};

/** 审批进度 */
const onProgress = (row: BpmOALeaveApi.LeaveVO) => {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId },
  });
};

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<BpmOALeaveApi.LeaveVO>) {
  switch (code) {
    case 'cancel': {
      onCancel(row);
      break;
    }
    case 'detail': {
      onDetail(row);
      break;
    }
    case 'progress': {
      onProgress(row);
      break;
    }
  }
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <DocAlert
      title="审批接入（业务表单）"
      url="https://doc.iocoder.cn/bpm/use-business-form/"
    />

    <Grid table-title="请假列表">
      <template #toolbar-tools>
        <Button
          type="primary"
          @click="onCreate"
          v-access:code="['bpm:category:create']"
        >
          <Plus class="size-5" />
          发起请假
        </Button>
      </template>

      <template #userIds-cell="{ row }">
        <span
          v-for="(userId, index) in row.userIds"
          :key="userId"
          class="pr-5px"
        >
          {{ dataList.find((user) => user.id === userId)?.nickname }}
          <span v-if="index < row.userIds.length - 1">、</span>
        </span>
      </template>
    </Grid>
  </Page>
</template>
