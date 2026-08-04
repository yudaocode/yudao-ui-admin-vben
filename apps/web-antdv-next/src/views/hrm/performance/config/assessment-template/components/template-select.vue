<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

import { Select } from 'antdv-next';

import {
  getPerformanceAssessmentTemplate,
  getPerformanceAssessmentTemplateSimpleList,
} from '#/api/hrm/performance/config/assessment-template';

defineOptions({ name: 'HrmPerformanceAssessmentTemplateSelect' });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
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
  <Select
    v-model:value="modelValue"
    :allow-clear="props.allowClear"
    :disabled="props.disabled"
    :options="options"
    :placeholder="props.placeholder"
    show-search
    option-filter-prop="label"
    class="w-full"
  />
</template>
