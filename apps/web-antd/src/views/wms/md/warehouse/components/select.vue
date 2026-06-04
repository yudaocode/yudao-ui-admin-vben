<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { WmsWarehouseApi } from '#/api/wms/md/warehouse';

import { computed, onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getWarehouseSimpleList } from '#/api/wms/md/warehouse';

defineOptions({ name: 'WmsWarehouseSelect', inheritAttrs: false });

withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
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
      value: warehouse.id,
    })),
);

/** 选中变化 */
function handleChange(value: SelectValue) {
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
  <Select
    v-bind="$attrs"
    :allow-clear="allowClear"
    :disabled="disabled"
    :loading="loading"
    :options="options"
    :placeholder="placeholder"
    :value="modelValue"
    class="w-full"
    option-filter-prop="label"
    show-search
    @change="handleChange"
  />
</template>
