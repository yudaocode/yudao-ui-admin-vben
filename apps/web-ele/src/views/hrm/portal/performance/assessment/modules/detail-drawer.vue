<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getPerformanceAssessment,
  getPerformanceAssessmentProcessRecordList,
} from '#/api/hrm/portal/performance/assessment';
import { DictTag } from '#/components/dict-tag';
import ProcessRecordTimeline from '#/views/hrm/performance/assessment/components/process-record-timeline.vue';
import { HrmPerformanceStageType } from '#/views/hrm/utils/constants';
import {
  formatHrmDate,
  formatHrmDateTime,
  formatHrmScore,
} from '#/views/hrm/utils/format';

import { useQuotaGridColumns, useReviewGridColumns } from '../data';

defineOptions({ name: 'HrmPortalPerformanceAssessmentDetail' });

const activeTab = ref('detail');
const assessment =
  ref<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>();
const recordList = ref<HrmPortalPerformanceAssessmentApi.ProcessRecord[]>([]);
type PerformanceAssessment =
  HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment;
type PerformanceQuota = NonNullable<PerformanceAssessment['quotas']>[number];
type PerformanceReviewStage = NonNullable<
  PerformanceAssessment['reviewStages']
>[number];

const [QuotaGrid, quotaGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useQuotaGridColumns(),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<PerformanceQuota>,
});

const [ReviewGrid, reviewGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useReviewGridColumns(),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<PerformanceReviewStage>,
});

const [Drawer, drawerApi] = useVbenDrawer({
  footer: false,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      assessment.value = undefined;
      recordList.value = [];
      return;
    }
    const { row, taskType } = drawerApi.getData() as {
      row:
        | HrmPortalPerformanceAssessmentApi.AssessmentSummary
        | HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment;
      taskType?: number;
    };
    if (!row?.id) {
      await drawerApi.close();
      return;
    }
    let stageId: number | undefined;
    if (taskType !== undefined) {
      const task =
        row as HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment;
      stageId =
        taskType === HrmPerformanceStageType.OTHER_SCORE
          ? task.currentReviewStage?.id
          : task.currentStage?.id;
      if (!stageId) {
        ElMessage.error('绩效任务阶段不存在');
        await drawerApi.close();
        return;
      }
    }
    activeTab.value = 'detail';
    drawerApi.lock();
    try {
      const [assessmentData, records] = await Promise.all([
        getPerformanceAssessment(row.id, stageId),
        getPerformanceAssessmentProcessRecordList(row.id, stageId),
      ]);
      assessment.value = assessmentData;
      recordList.value = records;
      await nextTick();
      await Promise.all([
        quotaGridApi.grid.reloadData(assessmentData.quotas || []),
        reviewGridApi.grid.reloadData(assessmentData.reviewStages || []),
      ]);
    } finally {
      drawerApi.unlock();
    }
  },
});
</script>

<template>
  <Drawer class="w-[760px]" title="绩效详情">
    <ElTabs v-model="activeTab">
      <ElTabPane label="绩效详情" name="detail">
        <ElDescriptions v-if="assessment" border :column="2" size="small">
          <ElDescriptionsItem label="考核名称" :span="2">
            {{ assessment.name || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="开始日期">
            {{ formatHrmDate(assessment.startTime) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="结束日期">
            {{ formatHrmDate(assessment.endTime) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前阶段">
            <DictTag
              type="hrm_performance_stage_status"
              :value="assessment.stageType ?? 0"
            />
          </ElDescriptionsItem>
          <ElDescriptionsItem label="绩效得分">
            {{ formatHrmScore(assessment.score) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="绩效等级">
            {{ assessment.resultLevel || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="绩效系数">
            {{ assessment.coefficient ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="归档时间" :span="2">
            {{ formatHrmDateTime(assessment.archiveTime) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="指标确认人">
            {{ assessment.targetConfirmationEmployeeName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="指标确认结果">
            <ElTag
              v-if="assessment.targetConfirmationResult === 1"
              type="success"
            >
              已通过
            </ElTag>
            <ElTag
              v-else-if="assessment.targetConfirmationResult === 0"
              type="danger"
            >
              已退回
            </ElTag>
            <span v-else>-</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="自评说明" :span="2">
            {{ assessment.selfComment || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="评分说明" :span="2">
            {{ assessment.reviewerComment || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="结果说明" :span="2">
            {{ assessment.resultComment || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="结果确认时间" :span="2">
            {{ formatHrmDateTime(assessment.resultConfirmationTime) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="指标确认意见" :span="2">
            {{ assessment.targetConfirmationComment || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申诉状态">
            <DictTag
              type="hrm_performance_appeal_status"
              :value="assessment.appealStatus ?? 0"
            />
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申诉提交时间">
            {{ formatHrmDateTime(assessment.appealSubmitTime) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申诉完成时间">
            {{ formatHrmDateTime(assessment.appealTime) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申诉原因" :span="2">
            {{ assessment.appealReason || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申诉附件" :span="2">
            <div
              v-if="assessment.appealFileUrls?.length"
              class="flex flex-col items-start"
            >
              <ElButton
                v-for="url in assessment.appealFileUrls"
                :key="url"
                link
                type="primary"
                @click="openWindow(url)"
              >
                {{ getFileNameFromUrl(url) }}
              </ElButton>
            </div>
            <span v-else>-</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申诉审批意见" :span="2">
            {{ assessment.appealComment || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <template v-if="assessment?.quotas?.length">
          <div class="mb-3 mt-5 text-base font-semibold">绩效指标</div>
          <QuotaGrid class="w-full" />
        </template>
        <template v-if="assessment?.reviewStages?.length">
          <div class="mb-3 mt-5 text-base font-semibold">评分流程</div>
          <ReviewGrid class="w-full" />
        </template>
      </ElTabPane>
      <ElTabPane label="流程记录" name="record">
        <ProcessRecordTimeline :records="recordList" />
      </ElTabPane>
    </ElTabs>
  </Drawer>
</template>
