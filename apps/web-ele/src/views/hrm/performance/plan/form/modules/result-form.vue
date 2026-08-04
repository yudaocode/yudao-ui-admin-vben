<script lang="ts" setup>
import type { HrmPerformanceResultTemplateApi } from '#/api/hrm/performance/config/result-template';
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { computed, ref } from 'vue';

import {
  ElDatePicker,
  ElFormItem,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';

import LevelForm from '#/views/hrm/performance/config/result-template/components/level-form.vue';

defineOptions({ name: 'HrmPerformancePlanResultForm' });

const props = defineProps<{
  disabled: boolean;
  resultTemplateList: HrmPerformanceResultTemplateApi.PerformanceResultTemplate[];
}>();

const model = defineModel<HrmPerformancePlanApi.PerformancePlan>({
  required: true,
});
const resultLevelFormRef = ref<InstanceType<typeof LevelForm>>();

const resultTemplateOptions = computed(() =>
  props.resultTemplateList.filter((t) => t.id !== undefined),
);

const resultLevels = computed({
  get: () => model.value.resultConfig?.levels || [],
  set: (value) => {
    model.value.resultConfig = {
      name: model.value.resultConfig?.name || '',
      levels: value,
    };
  },
});

const syncToSalary = computed({
  get: () => Boolean(model.value.syncToSalary),
  set: (value) => {
    model.value.syncToSalary = value;
    if (!value) model.value.paidForMonth = '';
  },
});

function handleResultTemplateChange(resultTemplateId?: number) {
  const resultTemplate = props.resultTemplateList.find(
    (t) => t.id === resultTemplateId,
  );
  model.value.resultConfig = resultTemplate
    ? {
        name: resultTemplate.name,
        levels: resultTemplate.levels.map((level) => ({ ...level })),
      }
    : { name: '', levels: [] };
}

function validate() {
  return resultLevelFormRef.value?.validate();
}

defineExpose({ validate });
</script>

<template>
  <div class="mx-auto max-w-[1100px]">
    <ElFormItem label="考核结果模板" required>
      <ElSelect
        v-model="model.resultTemplateId"
        clearable
        filterable
        placeholder="请选择考核结果模板"
        @change="handleResultTemplateChange"
      >
        <ElOption
          v-for="item in resultTemplateOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id!"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="同步到薪资">
      <ElSwitch v-model="syncToSalary" />
    </ElFormItem>
    <ElFormItem v-if="model.syncToSalary" label="参与计薪月份" required>
      <ElDatePicker
        v-model="model.paidForMonth"
        class="w-full"
        placeholder="请选择参与计薪月份"
        type="month"
        value-format="YYYY-MM"
      />
    </ElFormItem>
    <ElFormItem label="结果等级" required>
      <LevelForm
        ref="resultLevelFormRef"
        v-model="resultLevels"
        :disabled="props.disabled"
      />
    </ElFormItem>
  </div>
</template>
