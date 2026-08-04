<script lang="ts" setup>
import type { HrmSalaryChangeTemplateApi } from '#/api/hrm/salary/config/change-template';

import { computed, ref, watch } from 'vue';

import { Select } from 'antdv-next';

import { getSalaryOptionSimpleList } from '#/api/hrm/salary/config/option';

defineOptions({ name: 'HrmSalaryChangeOptionSelect' });

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    modelValue?: HrmSalaryChangeTemplateApi.ChangeOption[];
    placeholder?: string;
  }>(),
  {
    disabled: false,
    modelValue: () => [],
    placeholder: '请选择调薪项',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: HrmSalaryChangeTemplateApi.ChangeOption[]];
}>();

const loading = ref(false);
const optionList = ref<{ code: number; name: string }[]>([]);

const selectedCodes = computed({
  get: () => props.modelValue.map((item) => item.code),
  set: (codes: number[]) => {
    emit(
      'update:modelValue',
      codes.map((code) => {
        const selected = props.modelValue.find((item) => item.code === code);
        const option = optionList.value.find((item) => item.code === code);
        return { code, name: option?.name || selected?.name || '' };
      }),
    );
  },
});

async function init(selectAll = false) {
  if (optionList.value.length === 0) {
    loading.value = true;
    try {
      optionList.value = await getSalaryOptionSimpleList(true);
    } finally {
      loading.value = false;
    }
  }
  if (selectAll) {
    selectedCodes.value = optionList.value.map((item) => item.code);
  }
}

watch(
  () => props.modelValue,
  () => {
    if (optionList.value.length === 0) init();
  },
  { immediate: true },
);

defineExpose({ init });
</script>

<template>
  <Select
    v-model:value="selectedCodes"
    :disabled="disabled"
    :loading="loading"
    :options="
      optionList.map((item) => ({
        label: `${item.name} / ${item.code}`,
        value: item.code,
      }))
    "
    :placeholder="placeholder"
    class="w-full"
    mode="multiple"
    option-filter-prop="label"
  />
</template>
