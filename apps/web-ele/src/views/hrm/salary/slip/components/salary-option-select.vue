<script lang="ts" setup>
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';

import { computed, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getSalaryOptionSimpleList } from '#/api/hrm/salary/config/option';
import { HrmSalaryOptionCategoryCode } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmSalaryOptionSelect' });

const props = withDefaults(
  defineProps<{
    adjustable?: boolean;
    disabledCodes?: number[];
    modelValue?: number[];
    placeholder?: string;
  }>(),
  {
    adjustable: undefined,
    disabledCodes: () => [],
    modelValue: () => [],
    placeholder: '请选择薪资项',
  },
);

const emit = defineEmits<{
  change: [value: number[]];
  'update:modelValue': [value: number[]];
}>();

const loading = ref(false);
const optionList = ref<HrmSalaryOptionApi.SalaryOption[]>([]);
const selectableOptionList = computed(() =>
  optionList.value.filter(
    (option) => option.parentCode !== HrmSalaryOptionCategoryCode.ROOT,
  ),
);
const selectedCodes = computed({
  get: () => props.modelValue,
  set: (value: number[]) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

async function init() {
  if (optionList.value.length === 0) {
    loading.value = true;
    try {
      optionList.value = await getSalaryOptionSimpleList(props.adjustable);
    } finally {
      loading.value = false;
    }
  }
  return optionList.value;
}

defineExpose({ init });
</script>

<template>
  <ElSelect
    v-model="selectedCodes"
    :loading="loading"
    :placeholder="placeholder"
    class="w-full"
    clearable
    filterable
    multiple
  >
    <ElOption
      v-for="option in selectableOptionList"
      :key="option.code"
      :disabled="disabledCodes.includes(option.code)"
      :label="`${option.name} / ${option.code}`"
      :value="option.code"
    />
  </ElSelect>
</template>
