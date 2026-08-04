<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import {
  HrmPerformanceAppealStatus,
  HrmPerformanceAssessmentStageStatus,
  HrmPerformanceStageType,
} from '#/views/hrm/utils/constants';
import { formatHrmDate, formatHrmScore } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmPortalPerformanceTaskTable' });

defineProps<{
  activeStatus: number;
  activeTab: number;
  list: HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment[];
  loading: boolean;
}>();

const emit = defineEmits<{
  appeal: [id?: number];
  appealHandle: [assessmentId?: number, stageId?: number];
  detail: [row: HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment];
  quota: [id?: number];
  resultAudit: [assessmentId?: number, stageId?: number];
  resultConfirm: [id?: number];
  review: [assessmentId?: number, stageId?: number];
  targetConfirm: [assessmentId?: number, stageId?: number];
}>();

const { hasAccessByCodes } = useAccess();

const showSelfTable = (activeTab: number) =>
  activeTab === HrmPerformanceStageType.FILL_QUOTA ||
  activeTab === HrmPerformanceStageType.RESULT_CONFIRM;
</script>

<template>
  <ElTable
    v-if="showSelfTable(activeTab)"
    v-loading="loading"
    border
    :data="list"
    row-key="id"
    size="small"
  >
    <ElTableColumn align="center" label="序号" type="index" width="70" />
    <ElTableColumn
      label="考核名称"
      min-width="220"
      prop="name"
      show-overflow-tooltip
    />
    <ElTableColumn label="考核周期" min-width="210">
      <template #default="{ row }">
        {{ formatHrmDate(row.startTime) }} 至
        {{ formatHrmDate(row.endTime) }}
      </template>
    </ElTableColumn>
    <ElTableColumn align="center" label="当前阶段" width="130">
      <template #default="{ row }">
        {{ row.currentStage?.name || '-' }}
      </template>
    </ElTableColumn>
    <ElTableColumn align="center" label="绩效得分" width="110">
      <template #default="{ row }">
        {{ formatHrmScore(row.score) }}
      </template>
    </ElTableColumn>
    <ElTableColumn align="center" label="绩效等级" width="110">
      <template #default="{ row }">
        <ElTag v-if="row.resultLevel" type="success">
          {{ row.resultLevel }}
        </ElTag>
        <span v-else>-</span>
      </template>
    </ElTableColumn>
    <ElTableColumn
      align="center"
      label="绩效系数"
      prop="coefficient"
      width="100"
    />
    <ElTableColumn align="center" fixed="right" label="操作" width="260">
      <template #default="{ row }">
        <ElButton link type="primary" @click="emit('detail', row)">
          详情
        </ElButton>
        <ElButton
          v-if="
            activeTab === HrmPerformanceStageType.FILL_QUOTA &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            row.stageType === HrmPerformanceStageType.FILL_QUOTA &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          link
          type="primary"
          @click="emit('quota', row.id)"
        >
          制定指标
        </ElButton>
        <ElButton
          v-if="
            activeTab === HrmPerformanceStageType.RESULT_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          link
          type="primary"
          @click="emit('resultConfirm', row.id)"
        >
          确认结果
        </ElButton>
        <ElButton
          v-if="
            activeTab === HrmPerformanceStageType.RESULT_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            row.appealStatus !== HrmPerformanceAppealStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          link
          type="primary"
          @click="emit('appeal', row.id)"
        >
          提交申诉
        </ElButton>
      </template>
    </ElTableColumn>
  </ElTable>

  <ElTable
    v-else
    v-loading="loading"
    border
    :data="list"
    row-key="id"
    size="small"
  >
    <ElTableColumn align="center" label="序号" type="index" width="70" />
    <ElTableColumn
      label="考核名称"
      min-width="220"
      prop="name"
      show-overflow-tooltip
    />
    <ElTableColumn label="被考核人" min-width="160">
      <template #default="{ row }">
        {{ row.employeeName || '-' }}
        <span class="text-muted-foreground ml-1 text-xs">
          {{ row.jobNumber || '' }}
        </span>
      </template>
    </ElTableColumn>
    <ElTableColumn align="center" label="当前阶段" width="140">
      <template #default="{ row }">
        <span v-if="activeTab === HrmPerformanceStageType.OTHER_SCORE">
          {{ row.currentReviewStage?.name || '待评分' }}
        </span>
        <span
          v-else-if="
            activeTab === HrmPerformanceStageType.RESULT_AUDIT ||
            activeTab === HrmPerformanceStageType.APPEAL_CONFIRM
          "
        >
          {{ row.currentStage?.name || '待处理' }}
        </span>
        <DictTag
          v-else
          :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
          :value="row.stageType ?? 0"
        />
      </template>
    </ElTableColumn>
    <ElTableColumn align="center" label="指标数/评分权重/绩效得分" width="120">
      <template #default="{ row }">
        <span v-if="activeTab === HrmPerformanceStageType.TARGET_CONFIRM">
          {{ row.quotas?.length || 0 }}
        </span>
        <span v-else-if="activeTab === HrmPerformanceStageType.OTHER_SCORE">
          {{ row.currentReviewStage?.weight || 0 }}%
        </span>
        <span v-else>{{ formatHrmScore(row.score) }}</span>
      </template>
    </ElTableColumn>
    <ElTableColumn align="center" fixed="right" label="操作" width="110">
      <template #default="{ row }">
        <ElButton
          v-if="
            activeTab === HrmPerformanceStageType.TARGET_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          link
          type="primary"
          @click="emit('targetConfirm', row.id, row.currentStage?.id)"
        >
          去确认
        </ElButton>
        <ElButton
          v-else-if="
            activeTab === HrmPerformanceStageType.OTHER_SCORE &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          link
          type="primary"
          @click="emit('review', row.id, row.currentReviewStage?.id)"
        >
          去评分
        </ElButton>
        <ElButton
          v-else-if="
            activeTab === HrmPerformanceStageType.RESULT_AUDIT &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          link
          type="primary"
          @click="emit('resultAudit', row.id, row.currentStage?.id)"
        >
          去审核
        </ElButton>
        <ElButton
          v-else-if="
            activeTab === HrmPerformanceStageType.APPEAL_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          link
          type="primary"
          @click="emit('appealHandle', row.id, row.currentStage?.id)"
        >
          去确认
        </ElButton>
        <ElButton v-else link type="primary" @click="emit('detail', row)">
          查看
        </ElButton>
      </template>
    </ElTableColumn>
  </ElTable>
</template>
