<script lang="ts" setup>
import type { MesWmWarehouseAreaApi } from '#/api/mes/wm/warehouse/area';

import { computed, ref, useAttrs, watch, watchEffect } from 'vue';

import { Select, Tag, Tooltip } from 'antdv-next';

import { getWarehouseAreaSimpleList } from '#/api/mes/wm/warehouse/area';

defineOptions({ name: 'WmWarehouseAreaSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    locationId?: number;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    locationId: undefined,
    modelValue: undefined,
    placeholder: '请选择库位',
  },
);

const emit = defineEmits<{
  change: [item: MesWmWarehouseAreaApi.WarehouseArea | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const allList = ref<MesWmWarehouseAreaApi.WarehouseArea[]>([]);
const selectedItem = ref<MesWmWarehouseAreaApi.WarehouseArea>();
const selectOptions = computed(() =>
  allList.value.map((item) => ({
    label: item.name,
    value: item.id,
    raw: item,
  })),
);

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

/** 选中变化 */
function handleChange(val: any) {
  const item = allList.value.find((o) => o.id === val);
  selectedItem.value = item;
  emit('change', item);
}

/** 前端过滤（name + code） */
function filterOption(input: string, option: any) {
  const item = option?.raw as MesWmWarehouseAreaApi.WarehouseArea | undefined;
  if (!item) {
    return false;
  }
  const keyword = input.toLowerCase();
  return (
    !!item.name?.toLowerCase().includes(keyword) ||
    !!item.code?.toLowerCase().includes(keyword)
  );
}

watch(
  () => props.modelValue,
  (val) => {
    if (val === null) {
      selectedItem.value = undefined;
      return;
    }
    if (selectedItem.value?.id !== val && allList.value.length > 0) {
      selectedItem.value = allList.value.find((o) => o.id === val);
    }
  },
);

/** 库区变更或初始化时重新加载库位列表 */
watchEffect(async () => {
  allList.value = await getWarehouseAreaSimpleList(props.locationId);
  if (props.modelValue !== null) {
    selectedItem.value = allList.value.find((o) => o.id === props.modelValue);
  }
});
</script>

<template>
  <Tooltip :mouse-enter-delay="0.5" :open="selectedItem ? undefined : false">
    <template #title>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>所属仓库：{{ selectedItem.warehouseName || '-' }}</div>
        <div>所属库区：{{ selectedItem.locationName || '-' }}</div>
      </div>
    </template>
    <Select
      v-bind="attrs"
      v-model:value="selectValue"
      :allow-clear="allowClear"
      class="!w-full"
      :disabled="disabled"
      :filter-option="filterOption"
      :placeholder="placeholder"
      show-search
      :options="selectOptions"
      @change="handleChange"
    >
      <template #optionRender="{ option }">
        <div class="flex items-center gap-2">
          <span>{{ option.data.raw.name }}</span>
          <Tag v-if="option.data.raw.code" color="blue">
            编号: {{ option.data.raw.code }}
          </Tag>
        </div>
      </template>
    </Select>
  </Tooltip>
</template>
