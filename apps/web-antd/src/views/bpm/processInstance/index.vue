<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmTaskApi } from '#/api/bpm/task';

import { h } from 'vue';

import { Page, prompt } from '@vben/common-ui';

import { Button, message, Textarea } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelProcessInstanceByStartUser,
  getProcessInstanceMyPage,
} from '#/api/bpm/processInstance';
import { DictTag } from '#/components/dict-tag';
import { DocAlert } from '#/components/doc-alert';
import { router } from '#/router';
import { BpmProcessInstanceStatus, DICT_TYPE } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'BpmProcessInstanceManager' });

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
          return await getProcessInstanceMyPage({
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
    cellConfig: {
      height: 64,
    },
  } as VxeTableGridOptions<BpmTaskApi.TaskVO>,
});

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<BpmTaskApi.TaskVO>) {
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

/** 取消流程实例 */
function onCancel(row: BpmTaskApi.TaskVO) {
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
}

/** 查看流程实例 */
function onDetail(row: BpmTaskApi.TaskVO) {
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
    <DocAlert
      title="流程发起、取消、重新发起"
      url="https://doc.iocoder.cn/bpm/process-instance"
    />

    <FormModal @success="onRefresh" />
    <Grid table-title="流程状态">
      <!-- 摘要 -->
      <template #slot-summary="{ row }">
        <div
          class="flex flex-col py-2"
          v-if="row.summary && row.summary.length > 0"
        >
          <div v-for="(item, index) in row.summary" :key="index">
            <span class="text-gray-500">
              {{ item.key }} : {{ item.value }}
            </span>
          </div>
        </div>
        <div v-else>-</div>
      </template>

      <template #slot-status="{ row }">
        <!-- 审批中状态 -->
        <template
          v-if="
            row.status === BpmProcessInstanceStatus.RUNNING &&
            row.tasks?.length > 0
          "
        >
          <!-- 单人审批 -->
          <template v-if="row.tasks.length === 1">
            <span>
              <Button type="link" @click="onDetail(row)">
                {{ row.tasks[0].assigneeUser?.nickname }}
              </Button>
              ({{ row.tasks[0].name }}) 审批中
            </span>
          </template>
          <!-- 多人审批 -->
          <template v-else>
            <span>
              <Button type="link" @click="onDetail(row)">
                {{ row.tasks[0].assigneeUser?.nickname }}
              </Button>
              等 {{ row.tasks.length }} 人 ({{ row.tasks[0].name }})审批中
            </span>
          </template>
        </template>
        <!-- 非审批中状态 -->
        <template v-else>
          <DictTag
            :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
            :value="row.status"
          />
        </template>
      </template>
    </Grid>
  </Page>
</template>
