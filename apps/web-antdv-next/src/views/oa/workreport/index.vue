<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaWorkReportApi } from '#/api/oa/workreport';

import { computed, ref, toRaw } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';

import { message, TabPane, Tabs } from 'antdv-next';
import dayjs from 'dayjs';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelWorkReport,
  deleteWorkReport,
  getWorkReportPage,
  submitWorkReport,
} from '#/api/oa/workreport';
import { $t } from '#/locales';
import {
  OA_WORK_REPORT_STATUS,
  OA_WORK_REPORT_TYPE,
} from '#/views/oa/utils/constants';
import {
  formatWorkReportWeek,
  getWorkReportWeekStart,
} from '#/views/oa/utils/format';

import {
  useGridColumns,
  useGridFormSchema,
  workReportTypeTabs,
} from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'OaWorkReport' });

const activeType = ref<number>(OA_WORK_REPORT_TYPE.DAILY); // 当前汇报类型
// Tabs 的 key 为字符串，通过代理同步数值类型
const activeTypeKey = computed({
  get: () => String(activeType.value),
  set: (value) => {
    activeType.value = Number(value);
  },
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 切换汇报类型 */
async function handleTypeChange(key: number | string) {
  activeType.value = Number(key);
  // 表头跟随汇报类型切换，周报、月报展示周期列
  gridApi.setState({
    gridOptions: { columns: useGridColumns(activeType.value) || [] },
  });
  // 清空周次、月份条件并同步隐藏的类型字段
  await gridApi.formApi.setValues({
    type: activeType.value,
    reportWeek: undefined,
    reportMonth: undefined,
  });
  const formValues = await gridApi.formApi.getValues();
  gridApi.formApi.setLatestSubmissionValues(formValues);
  await gridApi.reload(formValues);
}

/** 新增工作汇报 */
function handleCreate() {
  formModalApi
    .setData({ formType: 'create', reportType: activeType.value })
    .open();
}

/** 修改工作汇报 */
function handleEdit(row: OaWorkReportApi.WorkReport) {
  formModalApi
    .setData({ formType: 'update', id: row.id, reportType: activeType.value })
    .open();
}

/** 查看工作汇报详情 */
function handleDetail(row: OaWorkReportApi.WorkReport) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 提交或取消提交工作汇报 */
async function handleStatusChange(row: OaWorkReportApi.WorkReport) {
  const isDraft = row.status === OA_WORK_REPORT_STATUS.DRAFT;
  try {
    await confirm(
      isDraft ? '确认提交该工作汇报吗？' : '确认取消提交并恢复为草稿吗？',
    );
    if (isDraft) {
      await submitWorkReport(row.id!);
    } else {
      await cancelWorkReport(row.id!);
    }
    message.success(isDraft ? '提交成功' : '取消提交成功');
    handleRefresh();
  } catch {}
}

/** 删除工作汇报 */
async function handleDelete(row: OaWorkReportApi.WorkReport) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.no]),
    duration: 0,
  });
  try {
    await deleteWorkReport(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.no]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    /** 重置时保持隐藏的汇报类型与当前页签一致 */
    handleReset: async () => {
      await gridApi.formApi.reset();
      await gridApi.formApi.setValues({ type: activeType.value });
      const formValues = await gridApi.formApi.getValues();
      gridApi.formApi.setLatestSubmissionValues(toRaw(formValues));
      gridApi.reload(formValues);
    },
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          // 将周次或月份转换为完整周期的开始时间范围，页面字段不传递给接口
          const { reportWeek, reportMonth, ...filters } = formValues;
          let periodTime: string[] | undefined;
          if (reportWeek) {
            // 校验周次格式，并回环校验该周次在当年真实存在（如 2026-53 可能回环到下一年）
            if (
              !/^[0-9]{4}-(0[1-9]|[1-4][0-9]|5[0-3])$/.test(reportWeek) ||
              formatWorkReportWeek(
                getWorkReportWeekStart(reportWeek).valueOf(),
              ) !== reportWeek
            ) {
              message.warning('周次格式为 yyyy-ww');
              return { list: [], total: 0 };
            }
            const weekStartTime = getWorkReportWeekStart(reportWeek);
            periodTime = [
              weekStartTime.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
              weekStartTime
                .add(6, 'day')
                .endOf('day')
                .format('YYYY-MM-DD HH:mm:ss'),
            ];
          } else if (reportMonth) {
            const monthStartTime = dayjs(`${reportMonth}-01`);
            periodTime = [
              monthStartTime.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
              monthStartTime.endOf('month').format('YYYY-MM-DD HH:mm:ss'),
            ];
          }
          return await getWorkReportPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...filters,
            periodTime,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaWorkReportApi.WorkReport>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />

    <div class="flex h-full flex-col">
      <!-- 汇报类型 -->
      <Tabs
        v-model:active-key="activeTypeKey"
        class="shrink-0"
        @change="handleTypeChange"
      >
        <TabPane
          v-for="item in workReportTypeTabs"
          :key="String(item.key)"
          :tab="item.label"
        />
      </Tabs>

      <!-- 列表 -->
      <div class="min-h-0 flex-1">
        <Grid table-title="工作汇报列表">
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: $t('ui.actionTitle.create', ['工作汇报']),
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['oa:work-report:create'],
                  onClick: handleCreate,
                },
              ]"
            />
          </template>
          <template #no="{ row }">
            <span class="cursor-pointer text-primary" @click="handleDetail(row)">
              {{ row.no }}
            </span>
          </template>
          <template #title="{ row }">
            <span class="cursor-pointer text-primary" @click="handleDetail(row)">
              {{ row.title }}
            </span>
          </template>
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label:
                    row.status === OA_WORK_REPORT_STATUS.DRAFT
                      ? '提交'
                      : '取消提交',
                  type: 'link',
                  auth: ['oa:work-report:update'],
                  onClick: handleStatusChange.bind(null, row),
                },
                {
                  label: $t('common.edit'),
                  type: 'link',
                  icon: ACTION_ICON.EDIT,
                  auth: ['oa:work-report:update'],
                  ifShow: row.status === OA_WORK_REPORT_STATUS.DRAFT,
                  onClick: handleEdit.bind(null, row),
                },
                {
                  label: $t('common.delete'),
                  type: 'link',
                  danger: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['oa:work-report:delete'],
                  ifShow: row.status === OA_WORK_REPORT_STATUS.DRAFT,
                  popConfirm: {
                    title: $t('ui.actionMessage.deleteConfirm', [row.no]),
                    confirm: handleDelete.bind(null, row),
                  },
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
