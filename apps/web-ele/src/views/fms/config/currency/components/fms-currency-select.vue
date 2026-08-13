<script lang="ts" setup>
import type { FmsCurrencyApi } from '#/api/fms/config/currency';

import { computed, ref, watch } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

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
  <ElSelect
    :clearable="clearable"
    :disabled="disabled"
    :filterable="filterable"
    :loading="loading"
    :model-value="modelValue"
    :multiple="multiple"
    :placeholder="placeholder"
    class="w-full"
    collapse-tags
    collapse-tags-tooltip
    @update:model-value="handleChange"
  >
    <ElOption
      v-for="item in currencyList"
      :key="item.id"
      :label="`${item.code} ${item.name}`"
      :value="item.id!"
    />
  </ElSelect>
</template>
