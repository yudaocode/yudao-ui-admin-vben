<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import {
  getPerformanceAssessmentTemplate,
  getPerformanceAssessmentTemplateSimpleList,
} from '#/api/hrm/performance/config/assessment-template';

defineOptions({ name: 'HrmPerformanceAssessmentTemplateSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    placeholder: '请选择考核模板',
  },
);

const modelValue = defineModel<number>();

const options = ref<{ label: string; value: number }[]>([]);

async function loadOptions() {
  const list = await getPerformanceAssessmentTemplateSimpleList();
  options.value = list.map((item) => ({
    label: item.name,
    value: item.id!,
  }));
  if (modelValue.value) {
    await ensureSelectedOption(modelValue.value);
  }
}

async function ensureSelectedOption(id: number) {
  if (options.value.some((item) => item.value === id)) return;
  const detail = await getPerformanceAssessmentTemplate(id);
  options.value.push({ label: detail.name, value: detail.id! });
}

watch(modelValue, async (id) => {
  if (id) await ensureSelectedOption(id);
});

onMounted(loadOptions);
</script>

<template>
  <ElSelect
    v-model="modelValue"
    :clearable="props.clearable"
    :disabled="props.disabled"
    :placeholder="props.placeholder"
    class="w-full"
    filterable
  >
    <ElOption
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </ElSelect>
</template>
