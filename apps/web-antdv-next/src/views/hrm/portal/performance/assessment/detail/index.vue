<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Drawer,
  message,
  Spin,
  Table,
  TabPane,
  Tabs,
  Tag,
} from 'antdv-next';

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

defineOptions({ name: 'HrmPortalPerformanceAssessmentDetail' });

const drawerVisible = ref(false);
const loading = ref(false);
const activeTab = ref('detail');
const assessment =
  ref<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>();
const recordList = ref<HrmPortalPerformanceAssessmentApi.ProcessRecord[]>([]);

const quotaColumns = [
  {
    title: '维度',
    dataIndex: 'dimensionName',
    key: 'dimensionName',
    minWidth: 120,
  },
  { title: '指标', dataIndex: 'name', key: 'name', minWidth: 160 },
  { title: '考核标准', dataIndex: 'standard', key: 'standard', minWidth: 200 },
  { title: '权重', key: 'weight', width: 80, align: 'center' as const },
  { title: '最终得分', key: 'finalScore', width: 90, align: 'center' as const },
];

const reviewColumns = [
  { title: '评分阶段', dataIndex: 'name', key: 'name', minWidth: 130 },
  {
    title: '评分人',
    dataIndex: 'handlerName',
    key: 'handlerName',
    minWidth: 120,
  },
  { title: '权重', key: 'weight', width: 80, align: 'center' as const },
  { title: '阶段得分', key: 'score', width: 90, align: 'center' as const },
  { title: '评语', dataIndex: 'comment', key: 'comment', minWidth: 160 },
];

/** 打开绩效考核详情 */
async function open(
  row:
    | HrmPortalPerformanceAssessmentApi.AssessmentSummary
    | HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment,
  taskType?: number,
) {
  if (!row.id) {
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
      return;
    }
  }
  drawerVisible.value = true;
  activeTab.value = 'detail';
  loading.value = true;
  try {
    const [assessmentData, records] = await Promise.all([
      getPerformanceAssessment(row.id, stageId),
      getPerformanceAssessmentProcessRecordList(row.id, stageId),
    ]);
    assessment.value = assessmentData;
    recordList.value = records;
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Drawer v-model:open="drawerVisible" :width="760" title="绩效详情">
    <Spin :spinning="loading">
      <Tabs v-model:active-key="activeTab">
        <TabPane key="detail" tab="绩效详情">
          <Descriptions v-if="assessment" bordered :column="2" size="small">
            <DescriptionsItem label="考核名称" :span="2">
              {{ assessment.name || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="开始日期">
              {{ formatHrmDate(assessment.startTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="结束日期">
              {{ formatHrmDate(assessment.endTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="当前阶段">
              <DictTag
                :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
                :value="assessment.stageType ?? 0"
              />
            </DescriptionsItem>
            <DescriptionsItem label="绩效得分">
              {{ formatHrmScore(assessment.score) }}
            </DescriptionsItem>
            <DescriptionsItem label="绩效等级">
              {{ assessment.resultLevel || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="绩效系数">
              {{ assessment.coefficient ?? '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="归档时间" :span="2">
              {{ formatHrmDateTime(assessment.archiveTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="指标确认人">
              {{ assessment.targetConfirmationEmployeeName || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="指标确认结果">
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
            </DescriptionsItem>
            <DescriptionsItem label="自评说明" :span="2">
              {{ assessment.selfComment || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="评分说明" :span="2">
              {{ assessment.reviewerComment || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="结果说明" :span="2">
              {{ assessment.resultComment || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="结果确认时间" :span="2">
              {{ formatHrmDateTime(assessment.resultConfirmationTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="指标确认意见" :span="2">
              {{ assessment.targetConfirmationComment || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="申诉状态">
              <DictTag
                :type="DICT_TYPE.HRM_PERFORMANCE_APPEAL_STATUS"
                :value="assessment.appealStatus ?? 0"
              />
            </DescriptionsItem>
            <DescriptionsItem label="申诉提交时间">
              {{ formatHrmDateTime(assessment.appealSubmitTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="申诉完成时间">
              {{ formatHrmDateTime(assessment.appealTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="申诉原因" :span="2">
              {{ assessment.appealReason || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="申诉附件" :span="2">
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
            </DescriptionsItem>
            <DescriptionsItem label="申诉审批意见" :span="2">
              {{ assessment.appealComment || '-' }}
            </DescriptionsItem>
          </Descriptions>

          <div
            v-if="assessment?.quotas?.length"
            class="mb-3 mt-5 text-base font-semibold"
          >
            绩效指标
          </div>
          <Table
            v-if="assessment?.quotas?.length"
            bordered
            :columns="quotaColumns"
            :data-source="assessment.quotas"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'weight'">
                {{ record.weight || 0 }}%
              </template>
              <template v-else-if="column.key === 'finalScore'">
                {{ formatHrmScore(record.finalScore) }}
              </template>
            </template>
          </Table>

          <div
            v-if="assessment?.reviewStages?.length"
            class="mb-3 mt-5 text-base font-semibold"
          >
            评分流程
          </div>
          <Table
            v-if="assessment?.reviewStages?.length"
            bordered
            :columns="reviewColumns"
            :data-source="assessment.reviewStages"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'weight'">
                {{ record.weight || 0 }}%
              </template>
              <template v-else-if="column.key === 'score'">
                {{ formatHrmScore(record.score) }}
              </template>
            </template>
          </Table>
        </TabPane>
        <TabPane key="record" tab="流程记录">
          <ProcessRecordTimeline :loading="loading" :records="recordList" />
        </TabPane>
      </Tabs>
    </Spin>
  </Drawer>
</template>
