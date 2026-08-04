<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';

import { Button, Table, Tag } from 'antdv-next';

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

const selfColumns = [
  { title: '序号', key: 'index', width: 70, align: 'center' as const },
  {
    title: '考核名称',
    dataIndex: 'name',
    key: 'name',
    minWidth: 220,
    ellipsis: true,
  },
  { title: '考核周期', key: 'cycle', minWidth: 210 },
  {
    title: '当前阶段',
    key: 'currentStage',
    width: 130,
    align: 'center' as const,
  },
  { title: '绩效得分', key: 'score', width: 110, align: 'center' as const },
  {
    title: '绩效等级',
    key: 'resultLevel',
    width: 110,
    align: 'center' as const,
  },
  {
    title: '绩效系数',
    dataIndex: 'coefficient',
    key: 'coefficient',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '操作',
    key: 'action',
    width: 260,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];

const otherColumns = [
  { title: '序号', key: 'index', width: 70, align: 'center' as const },
  {
    title: '考核名称',
    dataIndex: 'name',
    key: 'name',
    minWidth: 220,
    ellipsis: true,
  },
  { title: '被考核人', key: 'employee', minWidth: 160 },
  {
    title: '当前阶段',
    key: 'currentStage',
    width: 140,
    align: 'center' as const,
  },
  {
    title: '指标数/评分权重/绩效得分',
    key: 'metric',
    width: 120,
    align: 'center' as const,
  },
  {
    title: '操作',
    key: 'action',
    width: 110,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];
</script>

<template>
  <Table
    v-if="
      activeTab === HrmPerformanceStageType.FILL_QUOTA ||
      activeTab === HrmPerformanceStageType.RESULT_CONFIRM
    "
    bordered
    :columns="selfColumns"
    :data-source="list"
    :loading="loading"
    :pagination="false"
    row-key="id"
    :scroll="{ x: 1200 }"
    size="small"
  >
    <template #bodyCell="{ column, record, index }">
      <template v-if="column.key === 'index'">{{ index + 1 }}</template>
      <template v-else-if="column.key === 'cycle'">
        {{ formatHrmDate(record.startTime) }} 至
        {{ formatHrmDate(record.endTime) }}
      </template>
      <template v-else-if="column.key === 'currentStage'">
        {{ record.currentStage?.name || '-' }}
      </template>
      <template v-else-if="column.key === 'score'">
        {{ formatHrmScore(record.score) }}
      </template>
      <template v-else-if="column.key === 'resultLevel'">
        <Tag v-if="record.resultLevel" color="success">
          {{ record.resultLevel }}
        </Tag>
        <span v-else>-</span>
      </template>
      <template v-else-if="column.key === 'action'">
        <Button type="link" @click="emit('detail', record)">详情</Button>
        <Button
          v-if="
            activeTab === HrmPerformanceStageType.FILL_QUOTA &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            record.stageType === HrmPerformanceStageType.FILL_QUOTA &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('quota', record.id)"
        >
          制定指标
        </Button>
        <Button
          v-if="
            activeTab === HrmPerformanceStageType.RESULT_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('resultConfirm', record.id)"
        >
          确认结果
        </Button>
        <Button
          v-if="
            activeTab === HrmPerformanceStageType.RESULT_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            record.appealStatus !== HrmPerformanceAppealStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('appeal', record.id)"
        >
          提交申诉
        </Button>
      </template>
    </template>
  </Table>

  <Table
    v-else
    bordered
    :columns="otherColumns"
    :data-source="list"
    :loading="loading"
    :pagination="false"
    row-key="id"
    :scroll="{ x: 1000 }"
    size="small"
  >
    <template #bodyCell="{ column, record, index }">
      <template v-if="column.key === 'index'">{{ index + 1 }}</template>
      <template v-else-if="column.key === 'employee'">
        {{ record.employeeName || '-' }}
        <span class="text-muted-foreground ml-1 text-xs">
          {{ record.jobNumber || '' }}
        </span>
      </template>
      <template v-else-if="column.key === 'currentStage'">
        <span v-if="activeTab === HrmPerformanceStageType.OTHER_SCORE">
          {{ record.currentReviewStage?.name || '待评分' }}
        </span>
        <span
          v-else-if="
            activeTab === HrmPerformanceStageType.RESULT_AUDIT ||
            activeTab === HrmPerformanceStageType.APPEAL_CONFIRM
          "
        >
          {{ record.currentStage?.name || '待处理' }}
        </span>
        <DictTag
          v-else
          :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
          :value="record.stageType ?? 0"
        />
      </template>
      <template v-else-if="column.key === 'metric'">
        <span v-if="activeTab === HrmPerformanceStageType.TARGET_CONFIRM">
          {{ record.quotas?.length || 0 }}
        </span>
        <span v-else-if="activeTab === HrmPerformanceStageType.OTHER_SCORE">
          {{ record.currentReviewStage?.weight || 0 }}%
        </span>
        <span v-else>{{ formatHrmScore(record.score) }}</span>
      </template>
      <template v-else-if="column.key === 'action'">
        <Button
          v-if="
            activeTab === HrmPerformanceStageType.TARGET_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('targetConfirm', record.id, record.currentStage?.id)"
        >
          去确认
        </Button>
        <Button
          v-else-if="
            activeTab === HrmPerformanceStageType.OTHER_SCORE &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('review', record.id, record.currentReviewStage?.id)"
        >
          去评分
        </Button>
        <Button
          v-else-if="
            activeTab === HrmPerformanceStageType.RESULT_AUDIT &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('resultAudit', record.id, record.currentStage?.id)"
        >
          去审核
        </Button>
        <Button
          v-else-if="
            activeTab === HrmPerformanceStageType.APPEAL_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('appealHandle', record.id, record.currentStage?.id)"
        >
          去确认
        </Button>
        <Button v-else type="link" @click="emit('detail', record)">查看</Button>
      </template>
    </template>
  </Table>
</template>
