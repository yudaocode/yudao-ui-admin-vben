<script lang="ts" setup>
import type { WmsWarehouseApi } from '#/api/wms/md/warehouse';

import { computed, onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getWarehouseSimpleList } from '#/api/wms/md/warehouse';

defineOptions({ name: 'WmsWarehouseSelect', inheritAttrs: false });

withDefaults(
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
    placeholder: '请选择仓库',
  },
);

const emit = defineEmits<{
  change: [warehouse: undefined | WmsWarehouseApi.Warehouse];
  'update:modelValue': [value: number | undefined];
}>();

const loading = ref(false);
const warehouseList = ref<WmsWarehouseApi.Warehouse[]>([]);

const options = computed(() =>
  warehouseList.value
    .filter((warehouse) => warehouse.id !== undefined)
    .map((warehouse) => ({
      label: warehouse.name,
      value: warehouse.id!,
    })),
);

/** 选中变化 */
function handleChange(value: number | string | undefined) {
  const warehouseId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', warehouseId);
  emit(
    'change',
    warehouseList.value.find((warehouse) => warehouse.id === warehouseId),
  );
}

/** 查询仓库精简列表 */
async function getList() {
  loading.value = true;
  try {
    warehouseList.value = await getWarehouseSimpleList();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  getList();
});
</script>

<template>
  <ElSelect
    v-bind="$attrs"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :model-value="modelValue"
    :placeholder="placeholder"
    class="w-full"
    filterable
    @change="handleChange"
  >
    <ElOption
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </ElSelect>
</template>
