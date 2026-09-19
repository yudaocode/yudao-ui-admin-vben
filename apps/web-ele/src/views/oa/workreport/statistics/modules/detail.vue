<script lang="ts" setup>
import type { OaWorkReportApi } from '#/api/oa/workreport';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { formatDate } from '@vben/utils';

import dayjs from 'dayjs';
import { ElTable, ElTableColumn, ElTabPane, ElTabs } from 'element-plus';

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

const [Descriptions] = useDescription({
  border: true,
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

      <ElTabs v-model="detailTab">
        <ElTabPane
          name="submitted"
          :label="`已填 ${currentUser?.submittedReports.length || 0}`"
        >
          <!-- 已填汇报 -->
          <ElTable
            :data="currentUser?.submittedReports || []"
            max-height="360"
          >
            <ElTableColumn label="日期" prop="startTime" width="120">
              <template #default="{ row }">
                {{ formatDate(row.startTime) }}
              </template>
            </ElTableColumn>
            <ElTableColumn
              label="汇报标题"
              prop="title"
              min-width="260"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span
                  class="cursor-pointer text-primary"
                  @click="openReportDetail(row.id)"
                >
                  {{ row.title }}
                </span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" width="100">
              <template #default="{ row }">
                <DictTag
                  :type="DICT_TYPE.OA_WORK_REPORT_STATUS"
                  :value="row.status"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn label="提交时间" prop="createTime" width="170">
              <template #default="{ row }">
                {{ formatDate(row.createTime, 'YYYY-MM-DD HH:mm:ss') }}
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>
        <ElTabPane
          name="missing"
          :label="`未填 ${currentUser?.missingCount || 0}`"
        >
          <!-- 未填明细 -->
          <ElTable :data="missingRows" max-height="360">
            <ElTableColumn type="index" label="序号" width="60" />
            <ElTableColumn
              v-if="queryParams.type !== OA_WORK_REPORT_TYPE.DAILY"
              :label="
                queryParams.type === OA_WORK_REPORT_TYPE.WEEKLY ? '周次' : '月份'
              "
              prop="periodKey"
              width="130"
            />
            <ElTableColumn
              :label="
                queryParams.type === OA_WORK_REPORT_TYPE.DAILY
                  ? '应填日期'
                  : '起始日期'
              "
              prop="startDate"
              width="130"
            />
            <ElTableColumn
              v-if="queryParams.type === OA_WORK_REPORT_TYPE.DAILY"
              label="星期"
              prop="weekDay"
              width="100"
            />
            <ElTableColumn label="逾期天数" prop="overdueDays" width="110" />
          </ElTable>
        </ElTabPane>
      </ElTabs>
    </div>

    <!-- 工作汇报详情 -->
    <WorkReportModal />
  </Modal>
</template>
