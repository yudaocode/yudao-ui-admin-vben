<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { computed } from 'vue';

import {
  ElButton,
  ElCol,
  ElFormItem,
  ElInputNumber,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElRow,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
} from 'element-plus';

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

defineProps<{ disabled: boolean }>();

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

function handleTargetConfirmationChange(value: boolean | number | string) {
  const checked = Boolean(value);
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
</script>

<template>
  <div class="mx-auto max-w-[1200px]">
    <div class="process-section-title">指标制定</div>
    <ElFormItem label="指标制定" required>
      <ElRadioGroup
        v-model="model.quotaSettingType"
        @change="handleQuotaSettingChange"
      >
        <ElRadioButton :value="HrmPerformanceQuotaSettingType.SYSTEM">
          系统制定
        </ElRadioButton>
        <ElRadioButton :value="HrmPerformanceQuotaSettingType.EMPLOYEE">
          员工制定
        </ElRadioButton>
      </ElRadioGroup>
    </ElFormItem>
    <template
      v-if="model.quotaSettingType === HrmPerformanceQuotaSettingType.EMPLOYEE"
    >
      <ElFormItem label="目标确认">
        <ElSwitch
          v-model="model.targetConfirmation"
          :disabled="disabled"
          @change="handleTargetConfirmationChange"
        />
      </ElFormItem>
      <ElRow v-if="model.targetConfirmation" :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="确认人">
            <ElSelect
              v-model="targetConfirmationStage.type"
              :disabled="disabled"
              class="w-full"
              placeholder="请选择确认人"
              @change="handleTargetConfirmerTypeChange"
            >
              <ElOption
                v-for="item in HrmPerformanceRaterTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="确认范围">
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
          </ElFormItem>
        </ElCol>
      </ElRow>
    </template>

    <div class="process-section-title">考核评分流程</div>
    <ElFormItem label="评分流程" required>
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
            <ElButton
              :disabled="disabled || hasSelfStage"
              @click="addReviewStage(HrmPerformanceRaterType.SELF)"
            >
              新增自评
            </ElButton>
            <ElButton
              :disabled="disabled"
              @click="addReviewStage(HrmPerformanceRaterType.SUPERIOR)"
            >
              新增他评
            </ElButton>
          </div>
        </div>
        <ElTable :data="model.reviewStages || []" border>
          <ElTableColumn label="评分人" min-width="145">
            <template #default="{ row }">
              <ElSelect
                v-model="row.rater.type"
                :disabled="disabled"
                class="w-full"
                @change="handleRaterTypeChange(row)"
              >
                <ElOption
                  label="被考核人"
                  :value="HrmPerformanceRaterType.SELF"
                />
                <ElOption
                  label="上级"
                  :value="HrmPerformanceRaterType.SUPERIOR"
                />
                <ElOption
                  label="部门负责人"
                  :value="HrmPerformanceRaterType.DEPT_LEADER"
                />
                <ElOption
                  label="指定评分人"
                  :value="HrmPerformanceRaterType.SPECIFIED"
                />
              </ElSelect>
            </template>
          </ElTableColumn>
          <ElTableColumn label="评分人范围" min-width="190">
            <template #default="{ row }">
              <RaterLevelSelect
                v-if="
                  row.rater.type === HrmPerformanceRaterType.SUPERIOR ||
                  row.rater.type === HrmPerformanceRaterType.DEPT_LEADER
                "
                v-model="row.rater.level"
                :disabled="disabled"
                :rater-type="row.rater.type"
              />
              <EmployeeSelect
                v-else-if="row.rater.type === HrmPerformanceRaterType.SPECIFIED"
                v-model="row.rater.employeeId"
                :disabled="disabled"
                placeholder="请选择评分人"
              />
              <span v-else class="text-gray-500">当前被考核员工</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="评分权重" width="125">
            <template #default="{ row }">
              <div class="flex items-center gap-1">
                <ElInputNumber
                  v-model="row.weight"
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
          </ElTableColumn>
          <ElTableColumn label="评分方式" min-width="160">
            <template #default="{ row }">
              <ElSelect
                v-model="row.scoringType"
                :disabled="disabled"
                class="w-full"
              >
                <ElOption
                  label="按指标评分"
                  :value="HrmPerformanceReviewScoringType.QUOTA"
                />
              </ElSelect>
            </template>
          </ElTableColumn>
          <ElTableColumn label="可见内容" min-width="145">
            <template #default="{ row }">
              <ElSelect
                v-model="row.visibleContent"
                :disabled="disabled"
                class="w-full"
              >
                <ElOption
                  label="全部评分"
                  :value="HrmPerformanceReviewVisibleContent.ALL"
                />
                <ElOption
                  label="仅自己"
                  :value="HrmPerformanceReviewVisibleContent.SELF"
                />
              </ElSelect>
            </template>
          </ElTableColumn>
          <ElTableColumn align="center" label="评语必填" width="95">
            <template #default="{ row }">
              <ElSwitch v-model="row.requiredSetting" :disabled="disabled" />
            </template>
          </ElTableColumn>
          <ElTableColumn align="center" label="允许驳回" width="95">
            <template #default="{ row }">
              <ElSwitch
                v-model="row.rejectAuthority"
                :disabled="
                  disabled || row.rater.type === HrmPerformanceRaterType.SELF
                "
              />
            </template>
          </ElTableColumn>
          <ElTableColumn align="center" label="操作" width="72">
            <template #default="{ $index }">
              <ElButton
                :disabled="disabled"
                link
                title="删除评分阶段"
                type="danger"
                @click="removeReviewStage($index)"
              >
                删除
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </ElFormItem>

    <div class="process-section-title">
      <span>结果审核</span>
      <span class="process-section-tip">
        审核驳回后，员工重新提交评分；已通过的审核层级保留，从驳回层级继续处理。
      </span>
    </div>
    <ElFormItem label="启用结果审核">
      <ElSwitch v-model="resultAudit" :disabled="disabled" />
    </ElFormItem>
    <ElFormItem v-if="model.resultAudit" label="审核节点">
      <HandlerStageForm v-model="resultAuditStages" :disabled="disabled" />
    </ElFormItem>

    <div class="process-section-title">
      <span>结果确认</span>
      <span class="process-section-tip">
        员工确认考核结果；如有异议，可发起申诉，并由配置的申诉节点逐级处理。
      </span>
    </div>
    <ElFormItem label="启用结果确认">
      <ElSwitch v-model="resultConfirmation" :disabled="disabled" />
    </ElFormItem>
    <template v-if="model.resultConfirmation">
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="超期天数" required>
            <ElInputNumber
              v-model="model.appealTimeoutDays"
              :disabled="disabled"
              :max="100"
              :min="1"
              :precision="0"
              class="w-full"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="超期处理" required>
            <ElSelect
              v-model="model.appealTimeoutAction"
              :disabled="disabled"
              class="w-full"
            >
              <ElOption
                label="未审批自动拒绝"
                :value="HrmPerformanceAppealTimeoutAction.REJECT"
              />
              <ElOption
                label="未审批自动通过"
                :value="HrmPerformanceAppealTimeoutAction.APPROVE"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </template>
    <ElFormItem v-if="model.resultConfirmation" label="申诉节点">
      <HandlerStageForm v-model="appealStages" :disabled="disabled" />
    </ElFormItem>
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
  border-left: 3px solid var(--el-color-primary);
}

.process-section-title:not(:first-child) {
  margin-top: 28px;
}

.process-section-tip {
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
</style>
