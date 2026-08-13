<script lang="ts" setup>
import type { FmsCurrencyApi } from '#/api/fms/config/currency';

import { computed, ref, watch } from 'vue';

import { Select } from 'ant-design-vue';

import { getCurrencySimpleList } from '#/api/fms/config/currency';
import { useFmsStore } from '#/views/fms/store/fms';

defineOptions({ name: 'FmsCurrencySelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    excludeStandard?: boolean;
    filterable?: boolean;
    modelValue?: number | number[];
    multiple?: boolean;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    excludeStandard: false,
    filterable: true,
    modelValue: undefined,
    multiple: false,
    placeholder: '请选择币别',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined];
}>();

const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const loading = ref(false); // 币别列表的加载中
const list = ref<FmsCurrencyApi.Currency[]>([]); // 币别列表
const currencyList = computed(() =>
  props.excludeStandard ? list.value.filter((item) => !item.standard) : list.value,
); // 可选币别列表

/** 选中变化 */
function handleChange(value: unknown) {
  if (Array.isArray(value)) {
    emit(
      'update:modelValue',
      value.filter((item): item is number => typeof item === 'number'),
    );
    return;
  }
  emit('update:modelValue', typeof value === 'number' ? value : undefined);
}

/** 获得币别列表 */
async function getCurrencyList() {
  if (!accountSetId.value) {
    list.value = [];
    return;
  }
  loading.value = true;
  try {
    list.value = await getCurrencySimpleList(accountSetId.value);
  } finally {
    loading.value = false;
  }
}

/** 初始化并监听账套切换 */
watch(accountSetId, getCurrencyList, { immediate: true });
</script>

<template>
  <Select
    :allow-clear="clearable"
    :disabled="disabled"
    :loading="loading"
    :max-tag-count="multiple ? 'responsive' : undefined"
    :mode="multiple ? 'multiple' : undefined"
    :options="
      currencyList.map((item) => ({
        label: `${item.code} ${item.name}`,
        value: item.id,
      }))
    "
    :placeholder="placeholder"
    :show-search="filterable"
    :value="modelValue"
    class="w-full"
    option-filter-prop="label"
    @update:value="handleChange"
  />
</template>
