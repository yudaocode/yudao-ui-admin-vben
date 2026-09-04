<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, useTabs } from '@vben/hooks';

import {
  Avatar,
  Button,
  Descriptions,
  Empty,
  Steps,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getPerformanceAssessment,
  getPerformanceAssessmentArchive,
  getPerformanceAssessmentArchiveProcessRecordList,
  getPerformanceAssessmentProcessRecordList,
} from '#/api/hrm/performance/assessment';
import {
  HrmPerformanceAssessmentStageStatus,
  HrmPerformancePlanStatus,
} from '#/views/hrm/utils/constants';
import {
  formatHrmDateRange,
  formatHrmPerformanceCycleType,
} from '#/views/hrm/utils/format-performance';

import ProcessRecordTimeline from '../components/process-record-timeline.vue';
import { useScoreGridColumns } from '../data';

defineOptions({ name: 'HrmPerformanceAssessmentDetail' });

const route = useRoute();
const router = useRouter();
const { closeCurrentTab } = useTabs();

const assessmentId = Number(route.params.id);
const employeeId = Number(route.query.employeeId);
const planId = Number(route.query.planId);
const archived = route.query.archived === 'true';

const loading = ref(false);
const recordLoading = ref(false);
const detail = ref<HrmPerformanceAssessmentApi.PerformanceAssessment>({});
const processRecordList = ref<
  HrmPerformanceAssessmentApi.PerformanceProcessRecord[]
>([]);
const activeTab = ref('score');

const stageList = computed(() =>
  [...(detail.value.stages || [])].toSorted(
    (first, second) => (first.sort || 0) - (second.sort || 0),
  ),
);

const activeStage = computed(() => {
  if (detail.value.status === HrmPerformancePlanStatus.ARCHIVED) {
    return stageList.value.length;
  }
  const index = stageList.value.findIndex(
    (stage) => stage.status !== HrmPerformanceAssessmentStageStatus.PROCESSED,
  );
  return index === -1 ? stageList.value.length : index;
});

const scoreRows = computed(() =>
  (detail.value.quotas || []).flatMap((quota) => buildQuotaScoreRows(quota)),
);

const hasAssessmentComment = computed(
  () =>
    !!detail.value.selfComment ||
    !!detail.value.reviewerComment ||
    !!detail.value.resultComment,
);

const [ScoreGrid, scoreGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useScoreGridColumns(),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'key', isHover: true },
    spanMethod: getScoreSpanMethod,
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<any>,
});

function close() {
  closeCurrentTab();
  if (planId) {
    router.push({
      name: 'HrmPerformancePlanDetail',
      params: { id: planId },
      query: { tab: 'employees' },
    });
    return;
  }
  if (employeeId) {
    router.push({
      name: 'HrmPerformanceAssessmentEmployee',
      params: { employeeId },
    });
    return;
  }
  router.push('/hrm/performance/assessment');
}

async function getDetail() {
  if (!assessmentId) return;
  loading.value = true;
  recordLoading.value = true;
  scoreGridApi.setLoading(true);
  try {
    const [assessment, records] = archived
      ? await Promise.all([
          getPerformanceAssessmentArchive(assessmentId),
          getPerformanceAssessmentArchiveProcessRecordList(assessmentId),
        ])
      : await Promise.all([
          getPerformanceAssessment(assessmentId),
          getPerformanceAssessmentProcessRecordList(assessmentId),
        ]);
    detail.value = assessment;
    processRecordList.value = records;
  } finally {
    loading.value = false;
    recordLoading.value = false;
    scoreGridApi.setLoading(false);
  }
}

function buildQuotaScoreRows(
  quota: HrmPerformanceAssessmentApi.PerformanceAssessmentQuota,
) {
  const scoreStages = (detail.value.reviewStages || []).filter((stage) =>
    stage.quotaScoreList?.some((score) => score.assessmentQuotaId === quota.id),
  );
  if (scoreStages.length === 0) return [buildScoreRow(quota)];
  return scoreStages.map((stage) => {
    const quotaScore = stage.quotaScoreList?.find(
      (score) => score.assessmentQuotaId === quota.id,
    );
    return buildScoreRow(quota, stage, quotaScore?.score, quotaScore?.comment);
  });
}

function buildScoreRow(
  quota: HrmPerformanceAssessmentApi.PerformanceAssessmentQuota,
  stage?: HrmPerformanceAssessmentApi.PerformanceAssessmentStage,
  score?: number,
  comment?: string,
) {
  return {
    key: `${quota.id || 0}-${stage?.id || 0}`,
    dimensionId: quota.dimensionId,
    quotaId: quota.id,
    dimensionName: quota.dimensionName,
    quotaName: quota.name,
    description: quota.description,
    standard: quota.standard,
    targetValue: quota.targetValue,
    actualValue: quota.actualValue,
    weight: quota.weight,
    raterName: stage?.handlerName,
    score: score ?? quota.finalScore,
    comment: comment || quota.comment,
  };
}

function getScoreSpanMethod({ columnIndex, rowIndex }: any) {
  const row = scoreRows.value[rowIndex];
  if (columnIndex === 0) {
    return getRowSpan(
      rowIndex,
      (item) => item.dimensionId === row!.dimensionId,
    );
  }
  if (columnIndex >= 1 && columnIndex <= 6) {
    return getRowSpan(rowIndex, (item) => item.quotaId === row!.quotaId);
  }
  return { rowspan: 1, colspan: 1 };
}

function getRowSpan(rowIndex: number, matcher: (row: any) => boolean) {
  if (rowIndex > 0 && matcher(scoreRows.value[rowIndex - 1]!)) {
    return { rowspan: 0, colspan: 0 };
  }
  let rowSpan = 1;
  while (
    rowIndex + rowSpan < scoreRows.value.length &&
    matcher(scoreRows.value[rowIndex + rowSpan]!)
  ) {
    rowSpan += 1;
  }
  return { rowspan: rowSpan, colspan: 1 };
}

watch(
  scoreRows,
  async (rows) => {
    await nextTick();
    await scoreGridApi.grid.reloadData(rows);
  },
  { immediate: true },
);

onMounted(getDetail);
</script>

<template>
  <Page auto-content-height>
    <div class="mb-5 flex items-center gap-3">
      <Button type="link" @click="close">返回</Button>
      <span class="text-xl font-semibold">员工考核详情</span>
    </div>

    <div class="mb-6 flex items-center justify-between gap-6">
      <div class="flex min-w-0 items-center gap-3">
        <Avatar :size="48">{{ detail.employeeName?.slice(0, 1) }}</Avatar>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="truncate text-xl font-semibold">{{
              detail.name || '-'
            }}</span>
            <Tag v-if="detail.status !== null">
              {{
                getDictLabel(
                  DICT_TYPE.HRM_PERFORMANCE_PLAN_STATUS,
                  detail.status,
                )
              }}
            </Tag>
          </div>
          <div class="mt-1 text-gray-500">
            {{ detail.employeeName || '-' }} · {{ detail.jobNumber || '-' }}
          </div>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-8 text-center">
        <div>
          <div class="text-sm text-gray-500">绩效得分</div>
          <div class="mt-1 text-2xl font-semibold">
            {{ detail.score ?? '-' }}
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-500">考核结果</div>
          <div class="mt-1 text-lg font-semibold">
            {{ detail.resultLevel || '-' }}
            <span
              v-if="detail.coefficient !== null"
              class="text-sm font-normal"
            >
              （系数 {{ detail.coefficient }}）
            </span>
          </div>
        </div>
      </div>
    </div>

    <Descriptions bordered :column="4" class="mb-6">
      <Descriptions.Item label="考核周期">
        {{ formatHrmPerformanceCycleType(detail.cycleType) }}
      </Descriptions.Item>
      <Descriptions.Item label="周期范围">
        {{ detail.cycle || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="部门">
        {{ detail.deptName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="职位">
        {{ detail.postName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="聘用形式">
        {{
          detail.employeeType !== null
            ? getDictLabel(DICT_TYPE.HRM_EMPLOYEE_TYPE, detail.employeeType)
            : '-'
        }}
      </Descriptions.Item>
      <Descriptions.Item label="当前阶段">
        {{
          detail.stageType !== null
            ? getDictLabel(
                DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS,
                detail.stageType,
              )
            : '-'
        }}
      </Descriptions.Item>
      <Descriptions.Item label="当前处理人">
        {{ detail.currentHandlerName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="考核时间">
        {{ formatHrmDateRange(detail.startTime, detail.endTime) }}
      </Descriptions.Item>
    </Descriptions>

    <div class="mb-6">
      <div class="mb-4 border-l-4 border-primary pl-3 text-base font-semibold">
        考核流程
      </div>
      <Steps v-if="stageList.length" :current="activeStage" class="mb-4">
        <Steps.Step
          v-for="stage in stageList"
          :key="stage.id"
          :title="stage.name || '-'"
          :description="stage.handlerName || '系统'"
        />
      </Steps>
      <Empty v-else-if="!loading" description="暂无考核流程" />
    </div>

    <Tabs v-model:active-key="activeTab">
      <Tabs.TabPane key="score" tab="考核评分">
        <div
          class="mb-3 border-l-4 border-primary pl-3 text-base font-semibold"
        >
          考核评分明细
        </div>
        <ScoreGrid class="w-full">
          <template #weight="{ row }">{{ row.weight ?? 0 }}%</template>
        </ScoreGrid>
        <template v-if="hasAssessmentComment">
          <div
            class="mb-3 mt-6 border-l-4 border-primary pl-3 text-base font-semibold"
          >
            考核评语
          </div>
          <Descriptions bordered :column="3">
            <Descriptions.Item label="自评说明">
              {{ detail.selfComment || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="评分说明">
              {{ detail.reviewerComment || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="结果说明">
              {{ detail.resultComment || '-' }}
            </Descriptions.Item>
          </Descriptions>
        </template>
      </Tabs.TabPane>
      <Tabs.TabPane key="record" tab="考核记录">
        <ProcessRecordTimeline
          :loading="recordLoading"
          :records="processRecordList"
        />
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
