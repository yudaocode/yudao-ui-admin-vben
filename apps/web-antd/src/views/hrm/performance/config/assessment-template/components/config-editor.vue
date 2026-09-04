<script lang="ts" setup>
import type { HrmPerformanceAssessmentTemplateApi } from '#/api/hrm/performance/config/assessment-template';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  Alert,
  Button,
  Col,
  Empty,
  InputNumber,
  message,
  Row,
  Select,
  Tag,
} from 'ant-design-vue';

import {
  HrmPerformanceQuotaType,
  HrmPerformanceUpperLimitType,
} from '#/views/hrm/utils/constants';
import {
  getQuotaWeightTotal,
  isHundred,
  validateAssessmentConfig,
} from '#/views/hrm/utils/performance';

import DimensionForm from '../modules/dimension-form.vue';
import QuotaGrid from './quota-grid.vue';

defineOptions({ name: 'HrmPerformanceAssessmentConfigEditor' });

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    propPrefix?: string;
    showDimensions?: boolean;
  }>(),
  {
    disabled: false,
    propPrefix: '',
    showDimensions: true,
  },
);

const model = defineModel<HrmPerformanceAssessmentTemplateApi.AssessmentConfig>(
  {
    required: true,
  },
);

const currentDimensionIndex = ref<number>();
const [DimensionModal, dimensionModalApi] = useVbenModal({
  connectedComponent: DimensionForm,
  destroyOnClose: true,
});

const dimensionWeightTotal = computed(() =>
  (model.value.dimensions || []).reduce(
    (total, dimension) => total + Number(dimension.weight || 0),
    0,
  ),
);

const scoreCalculationOptions = getDictOptions(
  DICT_TYPE.HRM_PERFORMANCE_SCORE_CALCULATION,
  'number',
);

function validate() {
  const errorMessage = validateAssessmentConfig(model.value);
  if (errorMessage) {
    message.warning(errorMessage);
    return false;
  }
  return true;
}

function formatQuotaType(quotaType?: number) {
  return quotaType === HrmPerformanceQuotaType.BEHAVIOR
    ? '行为态度指标'
    : '业绩指标';
}

function openDimensionForm(index?: number) {
  currentDimensionIndex.value = index;
  dimensionModalApi
    .setData(index === undefined ? undefined : model.value.dimensions?.[index])
    .open();
}

function handleDimensionConfirm(
  dimension: HrmPerformanceAssessmentTemplateApi.AssessmentDimension,
) {
  model.value.dimensions ||= [];
  if (currentDimensionIndex.value === undefined) {
    model.value.dimensions.push(dimension);
    return;
  }
  model.value.dimensions.splice(currentDimensionIndex.value, 1, dimension);
}

function removeDimension(index: number) {
  model.value.dimensions?.splice(index, 1);
}

defineExpose({ validate });
</script>

<template>
  <Row :gutter="20">
    <Col :span="8">
      <div class="mb-4">
        <div class="mb-1 text-sm">总分计算</div>
        <Select
          v-model:value="model.scoreCalculation"
          :disabled="props.disabled"
          :options="scoreCalculationOptions"
          class="w-full"
          placeholder="请选择"
        />
      </div>
    </Col>
    <Col :span="8">
      <div class="mb-4">
        <div class="mb-1 text-sm">评分上限类型</div>
        <Select
          v-model:value="model.upperLimitType"
          :disabled="props.disabled"
          class="w-full"
          placeholder="请选择"
          :options="[
            { label: '统一上限', value: HrmPerformanceUpperLimitType.UNIFIED },
          ]"
        />
      </div>
    </Col>
    <Col :span="8">
      <div class="mb-4">
        <div class="mb-1 text-sm">评分上限</div>
        <InputNumber
          v-model:value="model.upperLimitScore"
          :disabled="props.disabled"
          :min="0"
          :precision="2"
          class="w-full"
          placeholder="请输入评分上限"
        />
      </div>
    </Col>
  </Row>
  <Alert
    :style="{ marginBottom: '16px' }"
    message="总分 = 评分 × 维度权重 × 指标权重，再累加；维度权重合计须为 100%，不可编辑维度的指标权重合计须为 100%，可编辑维度不可超过 100%。"
    show-icon
    type="info"
  />

  <slot name="after-score-config"></slot>

  <template v-if="props.showDimensions">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <span class="font-semibold">考核维度</span>
        <span class="ml-4 text-sm text-gray-500">
          当前维度权重合计：
          <span
            :class="
              !model.dimensions?.length
                ? 'text-gray-500'
                : isHundred(dimensionWeightTotal)
                  ? 'text-green-600'
                  : 'text-red-500'
            "
          >
            {{ model.dimensions?.length ? `${dimensionWeightTotal}%` : '--' }}
          </span>
        </span>
      </div>
      <Button
        :disabled="props.disabled"
        type="primary"
        @click="openDimensionForm()"
      >
        新增考核维度
      </Button>
    </div>

    <Empty v-if="!model.dimensions?.length" description="暂无考核维度" />
    <div
      v-for="(dimension, dimensionIndex) in model.dimensions"
      :key="dimensionIndex"
      class="mb-4 overflow-hidden rounded border"
    >
      <div
        class="flex items-center justify-between border-b bg-gray-50 px-4 py-3"
      >
        <div>
          <div class="flex items-center gap-3">
            <span class="font-semibold">{{ dimension.name }}</span>
            <Tag>{{ formatQuotaType(dimension.quotaType) }}</Tag>
            <span class="text-sm">
              维度权重
              <span class="text-orange-500">{{ dimension.weight || 0 }}%</span>
            </span>
            <Tag v-if="dimension.allowEdit" color="success">允许员工填写</Tag>
          </div>
          <div v-if="dimension.remark" class="mt-1 text-xs text-gray-500">
            {{ dimension.remark }}
          </div>
        </div>
        <div class="shrink-0">
          <Button
            :disabled="props.disabled"
            type="link"
            @click="openDimensionForm(dimensionIndex)"
          >
            编辑
          </Button>
          <Button
            :disabled="props.disabled"
            danger
            type="link"
            @click="removeDimension(dimensionIndex)"
          >
            删除
          </Button>
        </div>
      </div>
      <div class="p-4">
        <div class="mb-3">
          <span class="text-sm text-gray-500">
            指标权重合计：
            <span
              :class="
                isHundred(getQuotaWeightTotal(dimension))
                  ? 'text-green-600'
                  : 'text-red-500'
              "
            >
              {{ getQuotaWeightTotal(dimension) }}%
            </span>
          </span>
        </div>
        <QuotaGrid v-model="dimension.quotas" :disabled="props.disabled" />
      </div>
    </div>
    <DimensionModal @confirm="handleDimensionConfirm" />
  </template>
</template>
