<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { computed } from 'vue';

import { Col, DatePicker, FormItem, Input, Row, Select } from 'antdv-next';

import {
  HrmPerformanceCycleType,
  HrmPerformanceCycleTypeOptions,
} from '#/views/hrm/utils/constants';

import ScopeForm from './scope-form.vue';

defineOptions({ name: 'HrmPerformancePlanBasicForm' });

const model = defineModel<HrmPerformancePlanApi.PerformancePlan>({
  required: true,
});
const customDateRange = defineModel<string[]>('customDateRange', {
  required: true,
});

const scopes = computed({
  get: () => model.value.scopes || [],
  set: (value) => {
    model.value.scopes = value;
  },
});
const customDateRangeValue = computed({
  get: (): [string, string] | undefined =>
    customDateRange.value.length === 2
      ? [customDateRange.value[0]!, customDateRange.value[1]!]
      : undefined,
  set: (value: [string, string] | undefined) => {
    customDateRange.value = value ? [...value] : [];
  },
});

function handleCycleTypeChange() {
  model.value.cycle = '';
  model.value.quarter =
    model.value.cycleType === HrmPerformanceCycleType.QUARTER ? 1 : undefined;
  customDateRange.value = [];
}
</script>

<template>
  <div class="mx-auto max-w-[1100px]">
    <Row :gutter="20">
      <Col :span="12">
        <FormItem label="考核计划名称" required>
          <Input
            v-model:value="model.name"
            :maxlength="50"
            placeholder="请输入考核计划名称"
          />
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem label="周期类型" required>
          <Select
            v-model:value="model.cycleType"
            :options="[...HrmPerformanceCycleTypeOptions]"
            placeholder="请选择周期类型"
            @change="handleCycleTypeChange"
          />
        </FormItem>
      </Col>
    </Row>
    <FormItem label="考核周期" required>
      <DatePicker
        v-if="model.cycleType === HrmPerformanceCycleType.MONTH"
        v-model:value="model.cycle"
        class="w-full"
        picker="month"
        placeholder="请选择月份"
        value-format="YYYY-MM"
      />
      <div
        v-else-if="model.cycleType === HrmPerformanceCycleType.QUARTER"
        class="grid w-full grid-cols-2 gap-3"
      >
        <DatePicker
          v-model:value="model.cycle"
          class="w-full"
          picker="year"
          placeholder="请选择年份"
          value-format="YYYY"
        />
        <Select
          v-model:value="model.quarter"
          :options="[
            { label: '第一季度', value: 1 },
            { label: '第二季度', value: 2 },
            { label: '第三季度', value: 3 },
            { label: '第四季度', value: 4 },
          ]"
          placeholder="请选择季度"
        />
      </div>
      <DatePicker
        v-else-if="model.cycleType !== HrmPerformanceCycleType.OTHER"
        v-model:value="model.cycle"
        class="w-full"
        picker="year"
        placeholder="请选择年份"
        value-format="YYYY"
      />
      <DatePicker.RangePicker
        v-else
        v-model:value="customDateRangeValue"
        class="w-full"
        value-format="YYYY-MM-DD"
      />
    </FormItem>
    <FormItem label="考核范围" required>
      <ScopeForm v-model="scopes" />
    </FormItem>
    <FormItem label="考核说明">
      <Input.TextArea
        v-model:value="model.description"
        :maxlength="200"
        :rows="4"
        placeholder="请输入考核说明"
        show-count
      />
    </FormItem>
  </div>
</template>
