<script lang="ts" setup>
import type { FmsAuxiliaryItemApi } from '#/api/fms/config/auxiliary/item';

import { computed, ref, watch } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getAuxiliaryItemSimpleList } from '#/api/fms/config/auxiliary/item';
import { useFmsStore } from '#/views/fms/store/fms';

defineOptions({ name: 'FmsAuxiliaryItemSelect' });

const props = withDefaults(
  defineProps<{
    auxiliaryTypeId?: number; // 辅助核算类别编号
    clearable?: boolean;
    disabled?: boolean;
    filterable?: boolean;
    modelValue?: number | number[];
    multiple?: boolean;
    placeholder?: string;
  }>(),
  {
    auxiliaryTypeId: undefined,
    clearable: true,
    disabled: false,
    filterable: true,
    modelValue: undefined,
    multiple: false,
    placeholder: '请选择',
  },
);

const emit = defineEmits<{
  change: [
    item:
      | FmsAuxiliaryItemApi.AuxiliaryItemOption
      | FmsAuxiliaryItemApi.AuxiliaryItemOption[]
      | undefined,
  ];
  'update:modelValue': [value: number | number[] | undefined];
}>();

const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const loading = ref(false); // 辅助核算项目列表的加载中
const auxiliaryItemList = ref<FmsAuxiliaryItemApi.AuxiliaryItemOption[]>([]); // 辅助核算项目列表

/** 选中变化 */
function handleChange(value: unknown) {
  if (Array.isArray(value)) {
    const itemIds = value.filter(
      (item): item is number => typeof item === 'number',
    );
    emit('update:modelValue', itemIds);
    emit(
      'change',
      auxiliaryItemList.value.filter((item) => itemIds.includes(item.id)),
    );
    return;
  }
  const itemId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', itemId);
  emit('change', auxiliaryItemList.value.find((item) => item.id === itemId));
}

/** 获得辅助核算项目列表 */
async function getAuxiliaryItemList() {
  if (!accountSetId.value || !props.auxiliaryTypeId) {
    auxiliaryItemList.value = [];
    return;
  }
  loading.value = true;
  try {
    auxiliaryItemList.value = await getAuxiliaryItemSimpleList(
      accountSetId.value,
      props.auxiliaryTypeId,
    );
  } finally {
    loading.value = false;
  }
}

/** 初始化并监听账套和类别切换 */
watch([accountSetId, () => props.auxiliaryTypeId], getAuxiliaryItemList, {
  immediate: true,
});
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
    @change="handleChange"
  >
    <ElOption
      v-for="item in auxiliaryItemList"
      :key="item.id"
      :label="`${item.code} ${item.name}`"
      :value="item.id"
    />
  </ElSelect>
</template>
