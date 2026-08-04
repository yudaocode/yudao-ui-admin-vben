<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { computed } from 'vue';

import {
  Button,
  Col,
  FormItem,
  InputNumber,
  RadioButton,
  RadioGroup,
  Row,
  Select,
  Switch,
  Table,
} from 'antdv-next';

import EmployeeSelect from '#/views/hrm/employee/components/employee-select.vue';
import RaterLevelSelect from '#/views/hrm/performance/components/rater-level-select.vue';
import {
  HrmPerformanceAppealTimeoutAction,
  HrmPerformanceQuotaSettingType,
  HrmPerformanceRaterType,
  HrmPerformanceRaterTypeOptions,
  HrmPerformanceReviewScoringType,
  HrmPerformanceReviewVisibleContent,
} from '#/views/hrm/utils/constants';

import HandlerStageForm from './handler-stage-form.vue';

defineOptions({ name: 'HrmPerformancePlanProcessForm' });

const props = defineProps<{ disabled: boolean }>();

const model = defineModel<HrmPerformancePlanApi.PerformancePlan>({
  required: true,
});

const targetConfirmationStage = computed(
  () => model.value.targetConfirmationStage || {},
);

const reviewWeightTotal = computed(() =>
  Number(
    (model.value.reviewStages || [])
      .reduce((total, stage) => total + Number(stage.weight || 0), 0)
      .toFixed(2),
  ),
);

const hasSelfStage = computed(() =>
  (model.value.reviewStages || []).some(
    (stage) => stage.rater?.type === HrmPerformanceRaterType.SELF,
  ),
);

const resultAuditStages = computed({
  get: () => model.value.resultAuditStages || [],
  set: (value: HrmPerformancePlanApi.PerformanceHandlerStage[]) => {
    model.value.resultAuditStages = value;
  },
});

const appealStages = computed({
  get: () => model.value.appealStages || [],
  set: (value: HrmPerformancePlanApi.PerformanceHandlerStage[]) => {
    model.value.appealStages = value;
  },
});

const resultAudit = computed({
  get: () => Boolean(model.value.resultAudit),
  set: (value) => {
    model.value.resultAudit = value;
    if (value && !model.value.resultAuditStages?.length) {
      model.value.resultAuditStages = [createDefaultHandlerStage()];
    }
  },
});

const resultConfirmation = computed({
  get: () => Boolean(model.value.resultConfirmation),
  set: (value) => {
    model.value.resultConfirmation = value;
    if (value && !model.value.appealStages?.length) {
      model.value.appealStages = [createDefaultHandlerStage()];
    }
  },
});

function createDefaultHandlerStage(): HrmPerformancePlanApi.PerformanceHandlerStage {
  return {
    type: HrmPerformanceRaterType.DEPT_LEADER,
    level: 1,
  };
}

function handleQuotaSettingChange() {
  if (
    model.value.quotaSettingType === HrmPerformanceQuotaSettingType.EMPLOYEE
  ) {
    return;
  }
  clearTargetConfirmation();
}

function handleTargetConfirmationChange(checked: boolean) {
  model.value.targetConfirmation = checked;
  model.value.targetConfirmationStage = checked
    ? { type: HrmPerformanceRaterType.SUPERIOR, level: 1 }
    : undefined;
}

function handleTargetConfirmerTypeChange() {
  const stage = model.value.targetConfirmationStage;
  if (!stage) return;
  stage.level =
    stage.type === HrmPerformanceRaterType.SUPERIOR ||
    stage.type === HrmPerformanceRaterType.DEPT_LEADER
      ? 1
      : undefined;
  stage.employeeId = undefined;
}

function clearTargetConfirmation() {
  model.value.targetConfirmation = false;
  model.value.targetConfirmationStage = undefined;
}

function addReviewStage(raterType: number) {
  const reviewStages = model.value.reviewStages || [];
  reviewStages.push({
    rater: {
      type: raterType,
      level:
        raterType === HrmPerformanceRaterType.SUPERIOR ||
        raterType === HrmPerformanceRaterType.DEPT_LEADER
          ? 1
          : undefined,
    },
    weight: 0,
    scoringType: HrmPerformanceReviewScoringType.QUOTA,
    visibleContent: HrmPerformanceReviewVisibleContent.ALL,
    requiredSetting: false,
    rejectAuthority: raterType !== HrmPerformanceRaterType.SELF,
  });
  model.value.reviewStages = reviewStages;
}

function removeReviewStage(index: number) {
  model.value.reviewStages?.splice(index, 1);
}

function handleRaterTypeChange(
  stage: HrmPerformancePlanApi.PerformanceReviewStage,
) {
  if (!stage.rater) return;
  stage.rater.level =
    stage.rater.type === HrmPerformanceRaterType.SUPERIOR ||
    stage.rater.type === HrmPerformanceRaterType.DEPT_LEADER
      ? 1
      : undefined;
  stage.rater.employeeId = undefined;
  if (stage.rater.type === HrmPerformanceRaterType.SELF) {
    stage.rejectAuthority = false;
  }
}

const reviewColumns = [
  { title: '评分人', key: 'raterType', width: 145 },
  { title: '评分人范围', key: 'raterScope', minWidth: 190 },
  { title: '评分权重', key: 'weight', width: 125 },
  { title: '评分方式', key: 'scoringType', minWidth: 160 },
  { title: '可见内容', key: 'visibleContent', minWidth: 145 },
  {
    title: '评语必填',
    key: 'requiredSetting',
    width: 95,
    align: 'center' as const,
  },
  {
    title: '允许驳回',
    key: 'rejectAuthority',
    width: 95,
    align: 'center' as const,
  },
  { title: '操作', key: 'action', width: 72, align: 'center' as const },
];
</script>

<template>
  <div class="mx-auto max-w-[1200px]">
    <div class="process-section-title">指标制定</div>
    <FormItem label="指标制定" required>
      <RadioGroup
        v-model:value="model.quotaSettingType"
        button-style="solid"
        option-type="button"
        @change="handleQuotaSettingChange"
      >
        <RadioButton :value="HrmPerformanceQuotaSettingType.SYSTEM">
          系统制定
        </RadioButton>
        <RadioButton :value="HrmPerformanceQuotaSettingType.EMPLOYEE">
          员工制定
        </RadioButton>
      </RadioGroup>
    </FormItem>
    <template
      v-if="model.quotaSettingType === HrmPerformanceQuotaSettingType.EMPLOYEE"
    >
      <FormItem label="目标确认">
        <Switch
          v-model:checked="model.targetConfirmation"
          :disabled="disabled"
          @change="handleTargetConfirmationChange"
        />
      </FormItem>
      <Row v-if="model.targetConfirmation" :gutter="20">
        <Col :span="12">
          <FormItem label="确认人">
            <Select
              v-model:value="targetConfirmationStage.type"
              :disabled="disabled"
              :options="[...HrmPerformanceRaterTypeOptions]"
              class="w-full"
              placeholder="请选择确认人"
              @change="handleTargetConfirmerTypeChange"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="确认范围">
            <RaterLevelSelect
              v-if="
                targetConfirmationStage.type ===
                  HrmPerformanceRaterType.SUPERIOR ||
                targetConfirmationStage.type ===
                  HrmPerformanceRaterType.DEPT_LEADER
              "
              v-model="targetConfirmationStage.level"
              :disabled="disabled"
              :rater-type="targetConfirmationStage.type"
            />
            <EmployeeSelect
              v-else-if="
                targetConfirmationStage.type ===
                HrmPerformanceRaterType.SPECIFIED
              "
              v-model="targetConfirmationStage.employeeId"
              :disabled="disabled"
              placeholder="请选择员工"
            />
            <span
              v-else-if="
                targetConfirmationStage.type === HrmPerformanceRaterType.SELF
              "
              class="text-gray-500"
            >
              当前被考核员工
            </span>
          </FormItem>
        </Col>
      </Row>
    </template>

    <div class="process-section-title">考核评分流程</div>
    <FormItem label="评分流程" required>
      <div class="w-full">
        <div class="mb-2 flex min-h-10 items-center justify-between">
          <div
            :class="
              Math.abs(reviewWeightTotal - 100) < 0.001
                ? 'text-green-600'
                : 'text-red-500'
            "
            class="font-semibold"
          >
            权重合计 {{ reviewWeightTotal }}%
          </div>
          <div class="flex gap-2">
            <Button
              :disabled="disabled || hasSelfStage"
              @click="addReviewStage(HrmPerformanceRaterType.SELF)"
            >
              新增自评
            </Button>
            <Button
              :disabled="disabled"
              @click="addReviewStage(HrmPerformanceRaterType.SUPERIOR)"
            >
              新增他评
            </Button>
          </div>
        </div>
        <Table
          :columns="reviewColumns"
          :data-source="model.reviewStages || []"
          :pagination="false"
          bordered
          size="small"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'raterType'">
              <Select
                v-model:value="record.rater!.type"
                :disabled="disabled"
                :options="[
                  { label: '被考核人', value: HrmPerformanceRaterType.SELF },
                  { label: '上级', value: HrmPerformanceRaterType.SUPERIOR },
                  {
                    label: '部门负责人',
                    value: HrmPerformanceRaterType.DEPT_LEADER,
                  },
                  {
                    label: '指定评分人',
                    value: HrmPerformanceRaterType.SPECIFIED,
                  },
                ]"
                class="w-full"
                @change="handleRaterTypeChange(record)"
              />
            </template>
            <template v-else-if="column.key === 'raterScope'">
              <RaterLevelSelect
                v-if="
                  record.rater!.type === HrmPerformanceRaterType.SUPERIOR ||
                  record.rater!.type === HrmPerformanceRaterType.DEPT_LEADER
                "
                v-model="record.rater!.level"
                :disabled="disabled"
                :rater-type="record.rater!.type"
              />
              <EmployeeSelect
                v-else-if="
                  record.rater!.type === HrmPerformanceRaterType.SPECIFIED
                "
                v-model="record.rater!.employeeId"
                :disabled="disabled"
                placeholder="请选择评分人"
              />
              <span v-else class="text-gray-500">当前被考核员工</span>
            </template>
            <template v-else-if="column.key === 'weight'">
              <div class="flex items-center gap-1">
                <InputNumber
                  v-model:value="record.weight"
                  :controls="false"
                  :disabled="disabled"
                  :max="100"
                  :min="0.01"
                  :precision="2"
                  class="w-full"
                />
                <span class="text-gray-500">%</span>
              </div>
            </template>
            <template v-else-if="column.key === 'scoringType'">
              <Select
                v-model:value="record.scoringType"
                :disabled="disabled"
                :options="[
                  {
                    label: '按指标评分',
                    value: HrmPerformanceReviewScoringType.QUOTA,
                  },
                ]"
                class="w-full"
              />
            </template>
            <template v-else-if="column.key === 'visibleContent'">
              <Select
                v-model:value="record.visibleContent"
                :disabled="disabled"
                :options="[
                  {
                    label: '全部评分',
                    value: HrmPerformanceReviewVisibleContent.ALL,
                  },
                  {
                    label: '仅自己',
                    value: HrmPerformanceReviewVisibleContent.SELF,
                  },
                ]"
                class="w-full"
              />
            </template>
            <template v-else-if="column.key === 'requiredSetting'">
              <Switch
                v-model:checked="record.requiredSetting"
                :disabled="disabled"
              />
            </template>
            <template v-else-if="column.key === 'rejectAuthority'">
              <Switch
                v-model:checked="record.rejectAuthority"
                :disabled="
                  disabled ||
                  record.rater!.type === HrmPerformanceRaterType.SELF
                "
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <Button
                :disabled="disabled"
                danger
                title="删除评分阶段"
                type="link"
                @click="removeReviewStage(index)"
              >
                删除
              </Button>
            </template>
          </template>
        </Table>
      </div>
    </FormItem>

    <div class="process-section-title">
      <span>结果审核</span>
      <span class="process-section-tip">
        审核驳回后，员工重新提交评分；已通过的审核层级保留，从驳回层级继续处理。
      </span>
    </div>
    <FormItem label="启用结果审核">
      <Switch v-model:checked="resultAudit" :disabled="disabled" />
    </FormItem>
    <FormItem v-if="model.resultAudit" label="审核节点">
      <HandlerStageForm v-model="resultAuditStages" :disabled="disabled" />
    </FormItem>

    <div class="process-section-title">
      <span>结果确认</span>
      <span class="process-section-tip">
        员工确认考核结果；如有异议，可发起申诉，并由配置的申诉节点逐级处理。
      </span>
    </div>
    <FormItem label="启用结果确认">
      <Switch v-model:checked="resultConfirmation" :disabled="disabled" />
    </FormItem>
    <template v-if="model.resultConfirmation">
      <Row :gutter="20">
        <Col :span="12">
          <FormItem label="超期天数" required>
            <InputNumber
              v-model:value="model.appealTimeoutDays"
              :disabled="disabled"
              :max="100"
              :min="1"
              :precision="0"
              class="w-full"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="超期处理" required>
            <Select
              v-model:value="model.appealTimeoutAction"
              :disabled="disabled"
              :options="[
                {
                  label: '未审批自动拒绝',
                  value: HrmPerformanceAppealTimeoutAction.REJECT,
                },
                {
                  label: '未审批自动通过',
                  value: HrmPerformanceAppealTimeoutAction.APPROVE,
                },
              ]"
              class="w-full"
            />
          </FormItem>
        </Col>
      </Row>
    </template>
    <FormItem v-if="model.resultConfirmation" label="申诉节点">
      <HandlerStageForm v-model="appealStages" :disabled="disabled" />
    </FormItem>
  </div>
</template>

<style scoped>
.process-section-title {
  display: flex;
  gap: 16px;
  align-items: center;
  padding-left: 10px;
  margin: 8px 0 16px;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  border-left: 3px solid hsl(var(--primary));
}

.process-section-title:not(:first-child) {
  margin-top: 28px;
}

.process-section-tip {
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}
</style>
