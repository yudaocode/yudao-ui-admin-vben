<script lang="ts" setup>
import type { HrmSalaryChangeTemplateApi } from '#/api/hrm/salary/config/change-template';

import { onMounted, ref, watch } from 'vue';

import { Select } from 'ant-design-vue';

import { getSalaryChangeTemplateList } from '#/api/hrm/salary/config/change-template';

defineOptions({ name: 'HrmSalaryChangeTemplateSelect' });

const props = withDefaults(
  defineProps<{
    modelValue?: number;
  }>(),
  {
    modelValue: undefined,
  },
);

const emit = defineEmits<{
  change: [];
  'update:modelValue': [value?: number];
}>();

const loading = ref(false);
const templateList = ref<HrmSalaryChangeTemplateApi.SalaryChangeTemplate[]>([]);

async function init() {
  loading.value = true;
  try {
    templateList.value = await getSalaryChangeTemplateList();
  } finally {
    loading.value = false;
  }
  return templateList.value;
}

function handleChange(value: unknown) {
  emit('update:modelValue', typeof value === 'number' ? value : undefined);
  emit('change');
}

watch(
  () => props.modelValue,
  (value) => {
    if (value === undefined && templateList.value.length > 0) {
      const defaultTemplate = templateList.value.find(
        (item) => item.defaultStatus,
      );
      if (defaultTemplate?.id) {
        emit('update:modelValue', defaultTemplate.id);
      }
    }
  },
);

onMounted(() => {
  init();
});

defineExpose({ init });
</script>

<template>
  <Select
    :loading="loading"
    :options="
      templateList.map((item) => ({
        label: item.name,
        value: item.id,
      }))
    "
    :value="modelValue"
    allow-clear
    class="w-full"
    placeholder="请选择调薪模板"
    @change="handleChange"
  />
</template>
