<script lang="ts" setup>
import type { OaWorkReportApi } from '#/api/oa/workreport';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { formatDate, formatDateTime } from '@vben/utils';

import { Table, TabPane, Tabs } from 'antdv-next';
import dayjs from 'dayjs';

import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import {
  OA_WEEKDAY_NAMES,
  OA_WORK_REPORT_TYPE,
} from '#/views/oa/utils/constants';
import { getWorkReportWeekStart } from '#/views/oa/utils/format';

import WorkReportForm from '../../modules/form.vue';

defineOptions({ name: 'OaWorkReportStatisticsDetail' });

const currentUser = ref<OaWorkReportApi.UserStatistics>(); // 当前查看的员工
const detailTab = ref('submitted'); // 汇报明细当前 Tab
const queryParams = ref<OaWorkReportApi.StatisticsReq>({
  type: OA_WORK_REPORT_TYPE.DAILY,
  startTime: '',
  endTime: '',
  queryStartTime: '',
  queryEndTime: '',
}); // 当前明细的统计条件

const getTitle = computed(
  () => `${currentUser.value?.userName || ''}的汇报明细`,
);

/** 未填明细，逾期从统计范围内的周期起始日期计算 */
const missingRows = computed(() =>
  (currentUser.value?.missingPeriodKeys || []).map((periodKey) => {
    const periodStartTime =
      queryParams.value.type === OA_WORK_REPORT_TYPE.WEEKLY
        ? getWorkReportWeekStart(periodKey)
        : dayjs(
            queryParams.value.type === OA_WORK_REPORT_TYPE.MONTHLY
              ? `${periodKey}-01`
              : periodKey,
          );
    const startTime = periodStartTime.isBefore(
      queryParams.value.startTime,
      'day',
    )
      ? dayjs(queryParams.value.startTime)
      : periodStartTime;
    return {
      periodKey,
      startDate: startTime.format('YYYY-MM-DD'),
      weekDay: OA_WEEKDAY_NAMES[startTime.day()],
      overdueDays: Math.max(
        0,
        dayjs().startOf('day').diff(startTime.startOf('day'), 'day'),
      ),
    };
  }),
);

/** 员工统计信息 */
const detailData = computed(() => ({
  userName: currentUser.value?.userName,
  deptName: currentUser.value?.deptName,
  period: `${formatDate(queryParams.value.startTime, 'YYYY-MM-DD')} ~ ${formatDate(queryParams.value.endTime, 'YYYY-MM-DD')}`,
}));

/** 已填汇报的表格列 */
const submittedColumns: any[] = [
  {
    key: 'startTime',
    title: '日期',
    dataIndex: 'startTime',
    width: 120,
    customRender: ({ text }: any) => formatDate(text),
  },
  { key: 'title', title: '汇报标题', dataIndex: 'title', ellipsis: true },
  { key: 'status', title: '状态', width: 100 },
  {
    key: 'createTime',
    title: '提交时间',
    dataIndex: 'createTime',
    width: 170,
    customRender: ({ text }: any) => formatDateTime(text),
  },
];

/** 未填明细的表格列 */
const missingColumns = computed(() => {
  const columns: any[] = [{ key: 'index', title: '序号', width: 60 }];
  if (queryParams.value.type !== OA_WORK_REPORT_TYPE.DAILY) {
    columns.push({
      key: 'periodKey',
      title:
        queryParams.value.type === OA_WORK_REPORT_TYPE.WEEKLY ? '周次' : '月份',
      dataIndex: 'periodKey',
      width: 130,
    });
  }
  columns.push({
    key: 'startDate',
    title:
      queryParams.value.type === OA_WORK_REPORT_TYPE.DAILY
        ? '应填日期'
        : '起始日期',
    dataIndex: 'startDate',
    width: 130,
  });
  if (queryParams.value.type === OA_WORK_REPORT_TYPE.DAILY) {
    columns.push({
      key: 'weekDay',
      title: '星期',
      dataIndex: 'weekDay',
      width: 100,
    });
  }
  columns.push({
    key: 'overdueDays',
    title: '逾期天数',
    dataIndex: 'overdueDays',
    width: 110,
  });
  return columns;
});

const [Descriptions] = useDescription({
  bordered: true,
  column: 3,
  schema: [
    { field: 'userName', label: '姓名' },
    { field: 'deptName', label: '部门' },
    { field: 'period', label: '统计周期' },
  ],
});

const [WorkReportModal, workReportModalApi] = useVbenModal({
  connectedComponent: WorkReportForm,
  destroyOnClose: true,
});

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      currentUser.value = undefined;
      return;
    }
    // 回填员工及统计条件
    const data = modalApi.getData() as {
      queryParams: OaWorkReportApi.StatisticsReq;
      tab: string;
      user: OaWorkReportApi.UserStatistics;
    };
    currentUser.value = data.user;
    detailTab.value = data.tab;
    queryParams.value = { ...data.queryParams };
  },
});

/** 打开工作汇报详情 */
function openReportDetail(id: number) {
  workReportModalApi.setData({ formType: 'detail', id }).open();
}
</script>

<template>
  <Modal
    :title="getTitle"
    class="w-[760px]"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <div class="px-4">
      <!-- 员工统计信息 -->
      <Descriptions :data="detailData" class="mb-4" />

      <Tabs v-model:active-key="detailTab">
        <TabPane
          key="submitted"
          :tab="`已填 ${currentUser?.submittedReports.length || 0}`"
        >
          <!-- 已填汇报 -->
          <Table
            :columns="submittedColumns"
            :data-source="currentUser?.submittedReports || []"
            :pagination="false"
            :scroll="{ y: 360 }"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'title'">
                <span
                  class="cursor-pointer text-primary"
                  @click="openReportDetail(record.id)"
                >
                  {{ record.title }}
                </span>
              </template>
              <template v-else-if="column.key === 'status'">
                <DictTag
                  :type="DICT_TYPE.OA_WORK_REPORT_STATUS"
                  :value="record.status"
                />
              </template>
            </template>
          </Table>
        </TabPane>
        <TabPane
          key="missing"
          :tab="`未填 ${currentUser?.missingCount || 0}`"
        >
          <!-- 未填明细 -->
          <Table
            :columns="missingColumns"
            :data-source="missingRows"
            :pagination="false"
            :scroll="{ y: 360 }"
            row-key="periodKey"
            size="small"
          >
            <template #bodyCell="{ column, index }">
              <template v-if="column.key === 'index'">
                {{ index + 1 }}
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </div>

    <!-- 工作汇报详情 -->
    <WorkReportModal />
  </Modal>
</template>
