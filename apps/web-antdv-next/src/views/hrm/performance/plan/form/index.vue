<script lang="ts" setup>
import type { HrmPerformanceResultTemplateApi } from '#/api/hrm/performance/config/result-template';
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { Button, Card, Form, message, Steps } from 'antdv-next';
import dayjs from 'dayjs';

import { getPerformanceResultTemplateSimpleList } from '#/api/hrm/performance/config/result-template';
import {
  createPerformancePlan,
  getPerformancePlan,
  updatePerformancePlan,
} from '#/api/hrm/performance/plan';
import { $t } from '#/locales';
import {
  HrmPerformanceAppealTimeoutAction,
  HrmPerformanceCycleType,
  HrmPerformancePlanScopeType,
  HrmPerformancePlanStatus,
  HrmPerformanceQuotaSettingType,
  HrmPerformanceRaterType,
  HrmPerformanceReviewScoringType,
  HrmPerformanceReviewVisibleContent,
} from '#/views/hrm/utils/constants';
import { formatHrmPerformanceReviewStageName } from '#/views/hrm/utils/format-performance';
import { createDefaultAssessmentConfig } from '#/views/hrm/utils/performance';

import BasicForm from './modules/basic-form.vue';
import IndicatorForm from './modules/indicator-form.vue';
import ProcessForm from './modules/process-form.vue';
import ResultForm from './modules/result-form.vue';

defineOptions({ name: 'HrmPerformancePlanForm' });

const route = useRoute();
const router = useRouter();
const { closeCurrentTab } = useTabs();

const formLoading = ref(false);
const currentStep = ref(0);
const customDateRange = ref<string[]>([]);
const resultTemplateList = ref<
  HrmPerformanceResultTemplateApi.PerformanceResultTemplate[]
>([]);
const formData = ref<HrmPerformancePlanApi.PerformancePlan>(
  createDefaultFormData(),
);

const viewMode = computed(() => route.query.type === 'view');
const planEditable = computed(
  () =>
    !viewMode.value &&
    (!formData.value.status ||
      formData.value.status === HrmPerformancePlanStatus.DRAFT ||
      formData.value.status === HrmPerformancePlanStatus.NOT_STARTED),
);

const pageTitle = computed(() => {
  if (!formData.value.id) return '新增 KPI 考核';
  return `${viewMode.value ? '查看' : '修改'} KPI 考核：${formData.value.name}`;
});

const steps = [
  { title: '基础设置' },
  { title: '指标设置' },
  { title: '流程设置' },
  { title: '结果设置' },
];

const indicatorFormRef = ref<InstanceType<typeof IndicatorForm>>();
const resultFormRef = ref<InstanceType<typeof ResultForm>>();

function createDefaultPlanScope(): HrmPerformancePlanApi.PerformanceScope {
  return {
    type: HrmPerformancePlanScopeType.EMPLOYEE_DEPT,
    employeeIds: [],
    deptIds: [],
  };
}

function createDefaultReviewStages(): HrmPerformancePlanApi.PerformanceReviewStage[] {
  return [
    {
      name: '员工自评',
      rater: { type: HrmPerformanceRaterType.SELF },
      weight: 30,
      scoringType: HrmPerformanceReviewScoringType.QUOTA,
      visibleContent: HrmPerformanceReviewVisibleContent.ALL,
      requiredSetting: false,
      rejectAuthority: false,
    },
    {
      name: '直属上级评分',
      rater: { type: HrmPerformanceRaterType.SUPERIOR, level: 1 },
      weight: 70,
      scoringType: HrmPerformanceReviewScoringType.QUOTA,
      visibleContent: HrmPerformanceReviewVisibleContent.ALL,
      requiredSetting: true,
      rejectAuthority: true,
    },
  ];
}

function createDefaultHandlerStage(): HrmPerformancePlanApi.PerformanceHandlerStage {
  return {
    type: HrmPerformanceRaterType.DEPT_LEADER,
    level: 1,
  };
}

function createDefaultFormData(): HrmPerformancePlanApi.PerformancePlan {
  return {
    name: '',
    cycleType: HrmPerformanceCycleType.MONTH,
    cycle: '',
    quarter: undefined,
    startTime: undefined,
    endTime: undefined,
    description: '',
    assessmentTemplateId: undefined,
    assessmentConfig: createDefaultAssessmentConfig(),
    resultTemplateId: undefined,
    resultConfig: { name: '', levels: [] },
    quotaSettingType: HrmPerformanceQuotaSettingType.SYSTEM,
    targetConfirmation: false,
    targetConfirmationStage: undefined,
    resultAudit: false,
    resultConfirmation: false,
    appealTimeoutDays: 2,
    appealTimeoutAction: HrmPerformanceAppealTimeoutAction.REJECT,
    syncToSalary: false,
    paidForMonth: '',
    scopes: [createDefaultPlanScope()],
    reviewStages: createDefaultReviewStages(),
    resultAuditStages: [createDefaultHandlerStage()],
    appealStages: [createDefaultHandlerStage()],
  };
}

function validateReviewStages(): string | undefined {
  const value = formData.value.reviewStages;
  if (!value?.length) return '请至少配置一个评分阶段';
  const reviewWeightTotal = value.reduce(
    (total, stage) => total + Number(stage.weight || 0),
    0,
  );
  if (Math.abs(reviewWeightTotal - 100) > 0.001) {
    return '评分权重合计必须等于 100%';
  }
  if (
    value.filter((stage) => stage.rater?.type === HrmPerformanceRaterType.SELF)
      .length > 1
  ) {
    return '只能配置一个员工自评阶段';
  }
  const raterKeys = new Set<string>();
  for (const stage of value) {
    const rater = stage.rater;
    if (!rater?.type || !stage.weight || stage.weight <= 0) {
      return '请完整填写评分人和权重';
    }
    if (
      (rater.type === HrmPerformanceRaterType.SUPERIOR ||
        rater.type === HrmPerformanceRaterType.DEPT_LEADER) &&
      !rater.level
    ) {
      return '请选择评分人层级';
    }
    if (rater.type === HrmPerformanceRaterType.SPECIFIED && !rater.employeeId) {
      return '请选择指定评分人';
    }
    const raterKey =
      rater.type === HrmPerformanceRaterType.SELF
        ? 'self'
        : `${rater.type}:${
            rater.type === HrmPerformanceRaterType.SPECIFIED
              ? rater.employeeId
              : rater.level
          }`;
    if (raterKeys.has(raterKey)) return '评分人配置不能重复';
    raterKeys.add(raterKey);
  }
  return undefined;
}

function validateTargetConfirmation(): string | undefined {
  if (
    formData.value.quotaSettingType !==
      HrmPerformanceQuotaSettingType.EMPLOYEE ||
    !formData.value.targetConfirmation
  ) {
    return undefined;
  }
  const stage = formData.value.targetConfirmationStage;
  if (
    !stage?.type ||
    !Object.values(HrmPerformanceRaterType).some((type) => type === stage.type)
  ) {
    return '请选择目标确认人';
  }
  if (
    (stage.type === HrmPerformanceRaterType.SUPERIOR ||
      stage.type === HrmPerformanceRaterType.DEPT_LEADER) &&
    !stage.level
  ) {
    return '请选择目标确认人层级';
  }
  if (stage.type === HrmPerformanceRaterType.SPECIFIED && !stage.employeeId) {
    return '请选择指定确认员工';
  }
  return undefined;
}

function validateScopes(): string | undefined {
  const value = formData.value.scopes;
  if (!value?.length || value.length > 3) return '请配置 1 至 3 组考核范围';
  for (const scope of value) {
    if (
      scope.type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT &&
      !scope.employeeIds?.length &&
      !scope.deptIds?.length
    ) {
      return '员工部门范围至少选择员工或部门';
    }
    if (
      scope.type === HrmPerformancePlanScopeType.EMPLOYMENT &&
      (!scope.employeeType || !scope.employeeStatuses?.length)
    ) {
      return '请完整选择聘用形式和员工状态';
    }
  }
  return undefined;
}

function validateHandlerStages(
  enabled: boolean,
  value: HrmPerformancePlanApi.PerformanceHandlerStage[] | undefined,
): string | undefined {
  if (!enabled) return undefined;
  if (!value?.length || value.length > 3) return '请配置 1 至 3 个处理节点';
  const handlerKeys = new Set<string>();
  for (const stage of value) {
    if (
      (stage.type === HrmPerformanceRaterType.SUPERIOR ||
        stage.type === HrmPerformanceRaterType.DEPT_LEADER) &&
      !stage.level
    ) {
      return '请选择处理人层级';
    }
    if (stage.type === HrmPerformanceRaterType.SPECIFIED && !stage.employeeId) {
      return '请选择指定处理员工';
    }
    const handlerKey = `${stage.type}:${
      stage.type === HrmPerformanceRaterType.SPECIFIED
        ? stage.employeeId
        : stage.level
    }`;
    if (handlerKeys.has(handlerKey)) return '处理人配置不能重复';
    handlerKeys.add(handlerKey);
  }
  return undefined;
}

function validateBasicStep(): string | undefined {
  if (!formData.value.name?.trim()) return '考核计划名称不能为空';
  if (formData.value.name.length > 50) return '考核计划名称不能超过 50 个字符';
  if (!formData.value.cycleType) return '请选择考核周期类型';
  if (
    formData.value.cycleType === HrmPerformanceCycleType.OTHER
      ? customDateRange.value.length !== 2
      : !formData.value.cycle
  ) {
    return '请选择考核周期';
  }
  if (
    formData.value.cycleType === HrmPerformanceCycleType.QUARTER &&
    !formData.value.quarter
  ) {
    return '请选择季度';
  }
  if ((formData.value.description?.length || 0) > 200) {
    return '考核说明不能超过 200 个字符';
  }
  return validateScopes();
}

function validateProcessStep(): string | undefined {
  if (!formData.value.quotaSettingType) return '请选择指标制定方式';
  const targetError = validateTargetConfirmation();
  if (targetError) return targetError;
  const reviewError = validateReviewStages();
  if (reviewError) return reviewError;
  const auditError = validateHandlerStages(
    Boolean(formData.value.resultAudit),
    formData.value.resultAuditStages,
  );
  if (auditError) return auditError;
  if (formData.value.resultConfirmation) {
    if (!formData.value.appealTimeoutDays) return '请输入超期天数';
    if (!formData.value.appealTimeoutAction) return '请选择超期处理方式';
  }
  return validateHandlerStages(
    Boolean(formData.value.resultConfirmation),
    formData.value.appealStages,
  );
}

function validateResultStep(): string | undefined {
  if (!formData.value.resultTemplateId) return '考核结果模板不能为空';
  if (formData.value.syncToSalary && !formData.value.paidForMonth) {
    return '请选择参与计薪月份';
  }
  return undefined;
}

async function validateStep(stepIndex: number) {
  if (stepIndex === 0) {
    const error = validateBasicStep();
    if (error) throw new Error(error);
    return;
  }
  if (stepIndex === 1) {
    if (!indicatorFormRef.value?.validate()) throw new Error('请完善考核指标');
    return;
  }
  if (stepIndex === 2) {
    const error = validateProcessStep();
    if (error) throw new Error(error);
    return;
  }
  if (stepIndex === 3) {
    const error = validateResultStep();
    if (error) throw new Error(error);
    if (!resultFormRef.value?.validate()) throw new Error('请完善结果等级');
  }
}

async function handleStepClick(index: number) {
  if (viewMode.value) {
    currentStep.value = index;
    return;
  }
  if (index <= currentStep.value) {
    currentStep.value = index;
    return;
  }
  for (let stepIndex = currentStep.value; stepIndex < index; stepIndex++) {
    try {
      await validateStep(stepIndex);
    } catch {
      currentStep.value = stepIndex;
      message.warning(`请完善${steps[stepIndex]?.title}`);
      return;
    }
  }
  currentStep.value = index;
}

function handlePreviousStep() {
  currentStep.value -= 1;
}

function handleNextStep() {
  handleStepClick(currentStep.value + 1);
}

async function validateAllSteps() {
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    try {
      await validateStep(stepIndex);
    } catch (error) {
      currentStep.value = stepIndex;
      throw error;
    }
  }
}

function fillCycleDates() {
  const cycleType = formData.value.cycleType;
  if (cycleType === HrmPerformanceCycleType.OTHER) {
    formData.value.startTime = dayjs(customDateRange.value[0])
      .startOf('day')
      .valueOf();
    formData.value.endTime = dayjs(customDateRange.value[1])
      .endOf('day')
      .valueOf();
    formData.value.cycle = customDateRange.value.join(' ~ ');
    formData.value.quarter = undefined;
    return;
  }
  const cycle = String(formData.value.cycle);
  if (cycleType === HrmPerformanceCycleType.MONTH) {
    const month = dayjs(`${cycle}-01`);
    formData.value.startTime = month.startOf('month').valueOf();
    formData.value.endTime = month.endOf('month').valueOf();
    formData.value.quarter = undefined;
    return;
  }
  const year = Number(cycle);
  let startMonth = 0;
  let endMonth = 11;
  if (cycleType === HrmPerformanceCycleType.QUARTER) {
    startMonth = ((formData.value.quarter || 1) - 1) * 3;
    endMonth = startMonth + 2;
  } else if (cycleType === HrmPerformanceCycleType.FIRST_HALF_YEAR) {
    endMonth = 5;
  } else if (cycleType === HrmPerformanceCycleType.SECOND_HALF_YEAR) {
    startMonth = 6;
  }
  formData.value.startTime = dayjs()
    .year(year)
    .month(startMonth)
    .startOf('month')
    .valueOf();
  formData.value.endTime = dayjs()
    .year(year)
    .month(endMonth)
    .endOf('month')
    .valueOf();
  if (cycleType !== HrmPerformanceCycleType.QUARTER) {
    formData.value.quarter = undefined;
  }
}

function close() {
  closeCurrentTab();
  if (formData.value.id) {
    router.push({
      name: 'HrmPerformancePlanDetail',
      params: { id: formData.value.id },
    });
    return;
  }
  router.push({ name: 'HrmPerformancePlan' });
}

async function submitForm() {
  try {
    await validateAllSteps();
  } catch (error) {
    message.warning(
      error instanceof Error ? error.message : '请完善 KPI 考核信息',
    );
    return;
  }
  formLoading.value = true;
  try {
    if (
      formData.value.quotaSettingType !==
      HrmPerformanceQuotaSettingType.EMPLOYEE
    ) {
      formData.value.targetConfirmation = false;
      formData.value.targetConfirmationStage = undefined;
    }
    fillCycleDates();
    formData.value.reviewStages = (formData.value.reviewStages || []).map(
      (stage) => ({
        ...stage,
        name: formatHrmPerformanceReviewStageName(stage),
        scoringType: HrmPerformanceReviewScoringType.QUOTA,
        rejectAuthority:
          stage.rater?.type === HrmPerformanceRaterType.SELF
            ? false
            : Boolean(stage.rejectAuthority),
      }),
    );
    if (formData.value.id) {
      await updatePerformancePlan(formData.value);
      message.success($t('ui.actionMessage.operationSuccess'));
    } else {
      const id = await createPerformancePlan(formData.value);
      formData.value.id = id;
      message.success($t('ui.actionMessage.operationSuccess'));
    }
    close();
  } finally {
    formLoading.value = false;
  }
}

async function initForm() {
  formLoading.value = true;
  try {
    resultTemplateList.value = await getPerformanceResultTemplateSimpleList({
      status: CommonStatusEnum.ENABLE,
    });
    if (route.query.type !== 'update' && !viewMode.value) return;
    const id = Number(route.query.id);
    if (!Number.isInteger(id) || id <= 0) {
      message.error('KPI 考核编号不正确');
      close();
      return;
    }
    const data = await getPerformancePlan(id);
    if (!data) {
      message.error('KPI 考核不存在');
      close();
      return;
    }
    if (
      !viewMode.value &&
      data.status !== HrmPerformancePlanStatus.DRAFT &&
      data.status !== HrmPerformancePlanStatus.NOT_STARTED
    ) {
      message.error('当前状态不允许修改 KPI 考核');
      close();
      return;
    }
    formData.value = data;
    formData.value.assessmentConfig ||= createDefaultAssessmentConfig();
    if (
      data.resultTemplateId &&
      data.resultConfig &&
      !resultTemplateList.value.some(
        (template) => template.id === data.resultTemplateId,
      )
    ) {
      resultTemplateList.value.unshift({
        id: data.resultTemplateId,
        name: data.resultConfig.name,
        levels: data.resultConfig.levels,
      });
    }
    formData.value.quotaSettingType ??= HrmPerformanceQuotaSettingType.SYSTEM;
    formData.value.targetConfirmation ??= false;
    formData.value.resultAudit ??= false;
    formData.value.resultConfirmation ??= false;
    formData.value.appealTimeoutDays ??= 2;
    formData.value.appealTimeoutAction ??=
      HrmPerformanceAppealTimeoutAction.REJECT;
    if (!formData.value.scopes?.length) {
      formData.value.scopes = [createDefaultPlanScope()];
    }
    if (!formData.value.reviewStages?.length) {
      formData.value.reviewStages = createDefaultReviewStages();
    }
    if (!formData.value.resultAuditStages?.length) {
      formData.value.resultAuditStages = [createDefaultHandlerStage()];
    }
    if (!formData.value.appealStages?.length) {
      formData.value.appealStages = [createDefaultHandlerStage()];
    }
    customDateRange.value =
      formData.value.cycleType === HrmPerformanceCycleType.OTHER &&
      formData.value.startTime &&
      formData.value.endTime
        ? [
            dayjs(formData.value.startTime).format('YYYY-MM-DD'),
            dayjs(formData.value.endTime).format('YYYY-MM-DD'),
          ]
        : [];
  } finally {
    formLoading.value = false;
  }
}

onMounted(initForm);
</script>

<template>
  <Page auto-content-height>
    <Card>
      <div class="mb-6 flex items-center justify-between">
        <div class="flex min-w-0 items-center gap-2">
          <IconifyIcon
            class="size-5 shrink-0 cursor-pointer"
            icon="lucide:arrow-left"
            @click="close"
          />
          <span :title="pageTitle" class="truncate text-base font-semibold">{{
            pageTitle
          }}</span>
        </div>
        <div class="flex gap-2">
          <Button @click="close">返回</Button>
          <Button
            v-if="currentStep > 0"
            :disabled="formLoading"
            @click="handlePreviousStep"
          >
            上一步
          </Button>
          <Button
            v-if="currentStep < steps.length - 1"
            :disabled="formLoading"
            type="primary"
            @click="handleNextStep"
          >
            下一步
          </Button>
          <Button
            v-else-if="planEditable"
            :loading="formLoading"
            type="primary"
            @click="submitForm"
          >
            保存
          </Button>
        </div>
      </div>

      <!-- 对齐源项目 el-steps align-center / 工资条发送 label-placement="vertical" -->
      <div class="mb-8 flex justify-center">
        <Steps
          :current="currentStep"
          class="plan-form-steps w-full max-w-[900px] cursor-pointer"
          label-placement="vertical"
          :items="steps.map((step) => ({ title: step.title }))"
          @change="handleStepClick"
        />
      </div>

      <Form
        :disabled="!planEditable"
        :label-col="{ style: { width: '128px' } }"
        layout="horizontal"
      >
        <BasicForm
          v-show="currentStep === 0"
          v-model="formData"
          v-model:custom-date-range="customDateRange"
        />
        <IndicatorForm
          v-show="currentStep === 1"
          ref="indicatorFormRef"
          v-model="formData"
          :disabled="!planEditable"
        />
        <ProcessForm
          v-show="currentStep === 2"
          v-model="formData"
          :disabled="!planEditable"
        />
        <ResultForm
          v-show="currentStep === 3"
          ref="resultFormRef"
          v-model="formData"
          :disabled="!planEditable"
          :result-template-list="resultTemplateList"
        />
      </Form>
    </Card>
  </Page>
</template>

<style scoped>
.plan-form-steps :deep(.ant-steps-item) {
  flex: 1;
  overflow: visible;
}

/* flex:1 后 Ant Steps 默认图标偏移失效，手动居中对齐源项目 align-center */
.plan-form-steps :deep(.ant-steps-item-container) {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.plan-form-steps :deep(.ant-steps-item-content) {
  width: 100%;
  text-align: center;
}

.plan-form-steps :deep(.ant-steps-item-title) {
  width: 100%;
}
</style>
