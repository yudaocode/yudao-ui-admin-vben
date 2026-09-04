<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import { Button, Descriptions, message, Tabs, Tag } from 'ant-design-vue';

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
        message.error('绩效任务阶段不存在');
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
    <Tabs v-model:active-key="activeTab">
      <Tabs.TabPane key="detail" tab="绩效详情">
        <Descriptions v-if="assessment" bordered :column="2" size="small">
          <Descriptions.Item label="考核名称" :span="2">
            {{ assessment.name || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="开始日期">
            {{ formatHrmDate(assessment.startTime) }}
          </Descriptions.Item>
          <Descriptions.Item label="结束日期">
            {{ formatHrmDate(assessment.endTime) }}
          </Descriptions.Item>
          <Descriptions.Item label="当前阶段">
            <DictTag
              :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
              :value="assessment.stageType ?? 0"
            />
          </Descriptions.Item>
          <Descriptions.Item label="绩效得分">
            {{ formatHrmScore(assessment.score) }}
          </Descriptions.Item>
          <Descriptions.Item label="绩效等级">
            {{ assessment.resultLevel || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="绩效系数">
            {{ assessment.coefficient ?? '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="归档时间" :span="2">
            {{ formatHrmDateTime(assessment.archiveTime) }}
          </Descriptions.Item>
          <Descriptions.Item label="指标确认人">
            {{ assessment.targetConfirmationEmployeeName || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="指标确认结果">
            <Tag
              v-if="assessment.targetConfirmationResult === 1"
              color="success"
            >
              已通过
            </Tag>
            <Tag
              v-else-if="assessment.targetConfirmationResult === 0"
              color="error"
            >
              已退回
            </Tag>
            <span v-else>-</span>
          </Descriptions.Item>
          <Descriptions.Item label="自评说明" :span="2">
            {{ assessment.selfComment || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="评分说明" :span="2">
            {{ assessment.reviewerComment || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="结果说明" :span="2">
            {{ assessment.resultComment || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="结果确认时间" :span="2">
            {{ formatHrmDateTime(assessment.resultConfirmationTime) }}
          </Descriptions.Item>
          <Descriptions.Item label="指标确认意见" :span="2">
            {{ assessment.targetConfirmationComment || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="申诉状态">
            <DictTag
              :type="DICT_TYPE.HRM_PERFORMANCE_APPEAL_STATUS"
              :value="assessment.appealStatus ?? 0"
            />
          </Descriptions.Item>
          <Descriptions.Item label="申诉提交时间">
            {{ formatHrmDateTime(assessment.appealSubmitTime) }}
          </Descriptions.Item>
          <Descriptions.Item label="申诉完成时间">
            {{ formatHrmDateTime(assessment.appealTime) }}
          </Descriptions.Item>
          <Descriptions.Item label="申诉原因" :span="2">
            {{ assessment.appealReason || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="申诉附件" :span="2">
            <div
              v-if="assessment.appealFileUrls?.length"
              class="flex flex-col items-start"
            >
              <Button
                v-for="url in assessment.appealFileUrls"
                :key="url"
                type="link"
                @click="openWindow(url)"
              >
                {{ getFileNameFromUrl(url) }}
              </Button>
            </div>
            <span v-else>-</span>
          </Descriptions.Item>
          <Descriptions.Item label="申诉审批意见" :span="2">
            {{ assessment.appealComment || '-' }}
          </Descriptions.Item>
        </Descriptions>

        <template v-if="assessment?.quotas?.length">
          <div class="mb-3 mt-5 text-base font-semibold">绩效指标</div>
          <QuotaGrid class="w-full" />
        </template>
        <template v-if="assessment?.reviewStages?.length">
          <div class="mb-3 mt-5 text-base font-semibold">评分流程</div>
          <ReviewGrid class="w-full" />
        </template>
      </Tabs.TabPane>
      <Tabs.TabPane key="record" tab="流程记录">
        <ProcessRecordTimeline :records="recordList" />
      </Tabs.TabPane>
    </Tabs>
  </Drawer>
</template>
