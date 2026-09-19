<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaPlanApi } from '#/api/oa/plan';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPlanReportPage } from '#/api/oa/plan';
import { DictTag } from '#/components/dict-tag';
import { OA_PLAN_TYPE } from '#/views/oa/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import CommentForm from './modules/comment-form.vue';

defineOptions({ name: 'OaPlanReport' });

const [CommentFormModal, commentFormModalApi] = useVbenModal({
  connectedComponent: CommentForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 获得统计周期开始时间，周报固定从周一开始，周日归入当前周 */
function getPeriodBeginTime(date: Dayjs, type: number) {
  if (type === OA_PLAN_TYPE.DAY) {
    return date.startOf('day');
  }
  if (type === OA_PLAN_TYPE.WEEK) {
    const dayOfWeek = date.day();
    return date.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day').startOf('day');
  }
  return date.startOf('month');
}

/** 切换计划类型 */
async function handleTypeChange() {
  // 切换类型后重置统计日期，重新归一统计周期
  await gridApi.formApi.setFieldValue('periodDate', dayjs().format('YYYY-MM-DD'));
  handleRefresh();
}

/** 选择统计日期 */
async function handlePeriodDateChange(date: unknown) {
  const values = await gridApi.formApi.getValues();
  // 周计划归一到周一、月计划归一到月初展示
  const beginTime = getPeriodBeginTime(dayjs(date as string), Number(values.type));
  await gridApi.formApi.setFieldValue(
    'periodDate',
    beginTime.format('YYYY-MM-DD'),
  );
  handleRefresh();
}

/** 切换上一个或下一个统计周期 */
async function handlePeriodChange(step: number) {
  const values = await gridApi.formApi.getValues();
  const unit =
    Number(values.type) === OA_PLAN_TYPE.DAY
      ? 'day'
      : Number(values.type) === OA_PLAN_TYPE.WEEK
        ? 'week'
        : 'month';
  await gridApi.formApi.setFieldValue(
    'periodDate',
    dayjs(values.periodDate as string).add(step, unit).format('YYYY-MM-DD'),
  );
  handleRefresh();
}

/** 打开点评表单 */
function handleComment(row: OaPlanApi.PlanReport) {
  commentFormModalApi.setData({ id: row.planId }).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema({
      onTypeChange: handleTypeChange,
      onPeriodDateChange: handlePeriodDateChange,
    }),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const type = Number(formValues?.type ?? OA_PLAN_TYPE.DAY);
          const beginTime = getPeriodBeginTime(
            dayjs((formValues?.periodDate as string) || undefined),
            type,
          );
          const endTime =
            type === OA_PLAN_TYPE.DAY
              ? beginTime
              : type === OA_PLAN_TYPE.WEEK
                ? beginTime.add(6, 'day')
                : beginTime.endOf('month');
          return await getPlanReportPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            userName: formValues?.userName,
            type,
            // 查询时间覆盖整个自然周期，包含结束日的最后一秒
            createTime: [
              beginTime.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
              endTime.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
            ],
          });
        },
      },
    },
    rowConfig: {
      keyField: 'userId',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaPlanApi.PlanReport>,
});
</script>

<template>
  <Page auto-content-height>
    <CommentFormModal @success="handleRefresh" />

    <Grid table-title="工作计划报表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '上一周期',
              onClick: handlePeriodChange.bind(null, -1),
            },
            {
              label: '下一周期',
              onClick: handlePeriodChange.bind(null, 1),
            },
          ]"
        />
      </template>
      <template #planInfo="{ row }">
        <template v-if="row.planId">
          <div class="font-medium">
            <span v-if="row.label">【{{ row.label }}】</span>{{ row.title }}
          </div>
          <div class="mt-1 whitespace-pre-line text-[13px] text-gray-500">
            {{ row.content }}
          </div>
          <div v-if="row.fileUrls?.length" class="mt-1">
            <a
              v-for="(fileUrl, index) in row.fileUrls"
              :key="fileUrl"
              :href="fileUrl"
              class="text-primary mr-2.5"
              target="_blank"
            >
              附件 {{ index + 1 }}
            </a>
          </div>
        </template>
        <span v-else class="text-gray-400">未提交</span>
      </template>
      <template #statusTag="{ row }">
        <DictTag
          v-if="row.planId"
          :type="DICT_TYPE.OA_PLAN_STATUS"
          :value="row.status"
        />
        <span v-else>-</span>
      </template>
      <template #commentText="{ row }">
        <div class="whitespace-pre-line">{{ row.comment || '-' }}</div>
      </template>
      <template #actions="{ row }">
        <TableAction
          v-if="row.planId"
          :actions="[
            {
              label: '点评',
              type: 'link',
              auth: ['oa:plan:comment'],
              onClick: handleComment.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
