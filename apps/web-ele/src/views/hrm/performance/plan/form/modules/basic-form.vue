<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { computed } from 'vue';

import {
  ElCol,
  ElDatePicker,
  ElFormItem,
  ElInput,
  ElOption,
  ElRow,
  ElSelect,
} from 'element-plus';

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

function handleCycleTypeChange() {
  model.value.cycle = '';
  model.value.quarter =
    model.value.cycleType === HrmPerformanceCycleType.QUARTER ? 1 : undefined;
  customDateRange.value = [];
}
</script>

<template>
  <div class="mx-auto max-w-[1100px]">
    <ElRow :gutter="20">
      <ElCol :span="12">
        <ElFormItem label="考核计划名称" required>
          <ElInput
            v-model="model.name"
            :maxlength="50"
            placeholder="请输入考核计划名称"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="周期类型" required>
          <ElSelect
            v-model="model.cycleType"
            class="w-full"
            placeholder="请选择周期类型"
            @change="handleCycleTypeChange"
          >
            <ElOption
              v-for="item in HrmPerformanceCycleTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
    </ElRow>
    <ElFormItem label="考核周期" required>
      <ElDatePicker
        v-if="model.cycleType === HrmPerformanceCycleType.MONTH"
        v-model="model.cycle"
        class="w-full"
        placeholder="请选择月份"
        type="month"
        value-format="YYYY-MM"
      />
      <div
        v-else-if="model.cycleType === HrmPerformanceCycleType.QUARTER"
        class="grid w-full grid-cols-2 gap-3"
      >
        <ElDatePicker
          v-model="model.cycle"
          class="w-full"
          placeholder="请选择年份"
          type="year"
          value-format="YYYY"
        />
        <ElSelect
          v-model="model.quarter"
          class="w-full"
          placeholder="请选择季度"
        >
          <ElOption label="第一季度" :value="1" />
          <ElOption label="第二季度" :value="2" />
          <ElOption label="第三季度" :value="3" />
          <ElOption label="第四季度" :value="4" />
        </ElSelect>
      </div>
      <ElDatePicker
        v-else-if="model.cycleType !== HrmPerformanceCycleType.OTHER"
        v-model="model.cycle"
        class="w-full"
        placeholder="请选择年份"
        type="year"
        value-format="YYYY"
      />
      <ElDatePicker
        v-else
        v-model="customDateRange"
        class="w-full"
        type="daterange"
        value-format="YYYY-MM-DD"
      />
    </ElFormItem>
    <ElFormItem label="考核范围" required>
      <ScopeForm v-model="scopes" />
    </ElFormItem>
    <ElFormItem label="考核说明">
      <ElInput
        v-model="model.description"
        :maxlength="200"
        :rows="4"
        placeholder="请输入考核说明"
        show-word-limit
        type="textarea"
      />
    </ElFormItem>
  </div>
</template>
