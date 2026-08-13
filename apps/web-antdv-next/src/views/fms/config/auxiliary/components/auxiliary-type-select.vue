<script lang="ts" setup>
import type { FmsAuxiliaryTypeApi } from '#/api/fms/config/auxiliary/type';

import { computed, ref, watch } from 'vue';

import { Select } from 'antdv-next';

import { getAuxiliaryTypeSimpleList } from '#/api/fms/config/auxiliary/type';
import { useFmsStore } from '#/views/fms/store/fms';

defineOptions({ name: 'FmsAuxiliaryTypeSelect' });

withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    filterable?: boolean;
    modelValue?: number | number[];
    multiple?: boolean;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    filterable: true,
    modelValue: undefined,
    multiple: false,
    placeholder: '请选择辅助核算',
  },
);

const emit = defineEmits<{
  change: [value: number | number[] | undefined];
  loaded: [list: FmsAuxiliaryTypeApi.AuxiliaryTypeOption[]];
  'update:modelValue': [value: number | number[] | undefined];
}>();

const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const loading = ref(false); // 辅助核算类别列表的加载中
const auxiliaryTypeList = ref<FmsAuxiliaryTypeApi.AuxiliaryTypeOption[]>([]); // 辅助核算类别列表

/** 选中变化 */
function handleChange(value: unknown) {
  if (Array.isArray(value)) {
    const typeIds = value.filter((item): item is number =>
      typeof item === 'number',
    );
    emit('update:modelValue', typeIds);
    emit('change', typeIds);
    return;
  }
  const typeId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', typeId);
  emit('change', typeId);
}

/** 获得辅助核算类别列表 */
async function getAuxiliaryTypeList() {
  if (!accountSetId.value) {
    auxiliaryTypeList.value = [];
    return;
  }
  loading.value = true;
  try {
    auxiliaryTypeList.value = await getAuxiliaryTypeSimpleList(
      accountSetId.value,
    );
    emit('loaded', auxiliaryTypeList.value);
  } finally {
    loading.value = false;
  }
}

/** 初始化并监听账套切换 */
watch(accountSetId, getAuxiliaryTypeList, { immediate: true });
</script>

<template>
  <Select
    :allow-clear="clearable"
    :disabled="disabled"
    :loading="loading"
    :max-tag-count="multiple ? 'responsive' : undefined"
    :mode="multiple ? 'multiple' : undefined"
    :options="
      auxiliaryTypeList.map((item) => ({ label: item.name, value: item.id }))
    "
    :placeholder="placeholder"
    :show-search="filterable"
    :value="modelValue"
    class="w-full"
    option-filter-prop="label"
    @change="handleChange"
  />
</template>
