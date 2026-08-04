<script lang="ts" setup>
import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';

import { computed, onMounted, ref, watch } from 'vue';

import { getInsuranceSchemeSimpleList } from '#/api/hrm/insurance/scheme';

defineOptions({ name: 'HrmInsuranceSchemeSelect' });

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
    placeholder: '请选择参保方案',
  },
);

const emit = defineEmits<{
  change: [scheme: HrmInsuranceSchemeApi.InsuranceScheme | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const loading = ref(false);
const schemeList = ref<HrmInsuranceSchemeApi.InsuranceScheme[]>([]);

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const options = computed(() =>
  schemeList.value
    .filter((scheme) => scheme.id !== undefined)
    .map((scheme) => ({
      label: scheme.name,
      value: scheme.id as number,
    })),
);

function handleChange(value: number | undefined) {
  emit(
    'change',
    schemeList.value.find((scheme) => scheme.id === value),
  );
}

async function loadSchemeList() {
  loading.value = true;
  try {
    schemeList.value = await getInsuranceSchemeSimpleList();
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value && schemeList.value.length === 0) {
      loadSchemeList();
    }
  },
  { immediate: true },
);

onMounted(loadSchemeList);
</script>

<template>
  <ElSelect
    v-model="selectValue"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :options="options"
    :placeholder="placeholder"
    class="w-full"
    filterable
    @change="handleChange"
  />
</template>
