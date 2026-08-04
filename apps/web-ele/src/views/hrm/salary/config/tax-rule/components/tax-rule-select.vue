<script lang="ts" setup>
import type { HrmSalaryTaxRuleApi } from '#/api/hrm/salary/config/tax-rule';

import { computed, onMounted, ref } from 'vue';

import { getSalaryTaxRuleList } from '#/api/hrm/salary/config/tax-rule';

defineOptions({ name: 'HrmSalaryTaxRuleSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择计税规则',
  },
);

const emit = defineEmits<{
  change: [rule: HrmSalaryTaxRuleApi.SalaryTaxRule | undefined];
  'update:modelValue': [value?: number];
}>();

const loading = ref(false);
const options = ref<(HrmSalaryTaxRuleApi.SalaryTaxRule & { id: number })[]>([]);

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

async function loadOptions() {
  loading.value = true;
  try {
    const data = await getSalaryTaxRuleList();
    options.value = data.filter(
      (item): item is HrmSalaryTaxRuleApi.SalaryTaxRule & { id: number } =>
        item.id !== undefined,
    );
  } finally {
    loading.value = false;
  }
}

function handleChange(value: number) {
  emit(
    'change',
    options.value.find((item) => item.id === value),
  );
}

onMounted(loadOptions);
</script>

<template>
  <ElSelect
    v-model="selectValue"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :options="options.map((item) => ({ label: item.name, value: item.id }))"
    :placeholder="placeholder"
    class="w-full"
    filterable
    @change="handleChange"
  />
</template>
