<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDrawer,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

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
      ElMessage.error('绩效任务阶段不存在');
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
  <ElDrawer
    v-model="drawerVisible"
    destroy-on-close
    size="760px"
    title="绩效详情"
  >
    <div v-loading="loading">
      <ElTabs v-model="activeTab">
        <ElTabPane label="绩效详情" name="detail">
          <ElDescriptions v-if="assessment" border :column="2" size="small">
            <ElDescriptionsItem label="考核名称" :span="2">
              {{ assessment.name || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="开始日期">
              {{
                formatHrmDate(
                  assessment.startTime ? +assessment.startTime : undefined,
                )
              }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="结束日期">
              {{
                formatHrmDate(
                  assessment.endTime ? +assessment.endTime : undefined,
                )
              }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前阶段">
              <DictTag
                :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
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
              {{ formatHrmDateTime(assessment.archiveTime?.valueOf()) }}
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
              {{
                formatHrmDateTime(assessment.resultConfirmationTime?.valueOf())
              }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="指标确认意见" :span="2">
              {{ assessment.targetConfirmationComment || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申诉状态">
              <DictTag
                :type="DICT_TYPE.HRM_PERFORMANCE_APPEAL_STATUS"
                :value="assessment.appealStatus ?? 0"
              />
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申诉提交时间">
              {{ formatHrmDateTime(assessment.appealSubmitTime?.valueOf()) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申诉完成时间">
              {{ formatHrmDateTime(assessment.appealTime?.valueOf()) }}
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

          <div
            v-if="assessment?.quotas?.length"
            class="mb-3 mt-5 text-base font-semibold"
          >
            绩效指标
          </div>
          <ElTable
            v-if="assessment?.quotas?.length"
            border
            :data="assessment.quotas"
            row-key="id"
            size="small"
          >
            <ElTableColumn label="维度" min-width="120" prop="dimensionName" />
            <ElTableColumn label="指标" min-width="160" prop="name" />
            <ElTableColumn label="考核标准" min-width="200" prop="standard" />
            <ElTableColumn align="center" label="权重" width="80">
              <template #default="{ row }">{{ row.weight || 0 }}%</template>
            </ElTableColumn>
            <ElTableColumn align="center" label="最终得分" width="90">
              <template #default="{ row }">
                {{ formatHrmScore(row.finalScore) }}
              </template>
            </ElTableColumn>
          </ElTable>

          <div
            v-if="assessment?.reviewStages?.length"
            class="mb-3 mt-5 text-base font-semibold"
          >
            评分流程
          </div>
          <ElTable
            v-if="assessment?.reviewStages?.length"
            border
            :data="assessment.reviewStages"
            row-key="id"
            size="small"
          >
            <ElTableColumn label="评分阶段" min-width="130" prop="name" />
            <ElTableColumn label="评分人" min-width="120" prop="handlerName" />
            <ElTableColumn align="center" label="权重" width="80">
              <template #default="{ row }">{{ row.weight || 0 }}%</template>
            </ElTableColumn>
            <ElTableColumn align="center" label="阶段得分" width="90">
              <template #default="{ row }">
                {{ formatHrmScore(row.score) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="评语" min-width="160" prop="comment" />
          </ElTable>
        </ElTabPane>
        <ElTabPane label="流程记录" name="record">
          <ProcessRecordTimeline :loading="loading" :records="recordList" />
        </ElTabPane>
      </ElTabs>
    </div>
  </ElDrawer>
</template>
