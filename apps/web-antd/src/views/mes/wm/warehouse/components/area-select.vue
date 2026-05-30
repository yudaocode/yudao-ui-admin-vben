<script lang="ts" setup>
import type { MesWmWarehouseAreaApi } from '#/api/mes/wm/warehouse/area';

import { computed, ref, useAttrs, watch, watchEffect } from 'vue';

import { Select, SelectOption, Tag, Tooltip } from 'ant-design-vue';

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
  const item = allList.value.find((o) => o.id === option.value);
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
    if (val == null) {
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
  if (props.modelValue != null) {
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
      @change="handleChange"
    >
      <SelectOption v-for="item in allList" :key="item.id" :value="item.id">
        <div class="flex items-center gap-2">
          <span>{{ item.name }}</span>
          <Tag v-if="item.code" color="blue">编号: {{ item.code }}</Tag>
        </div>
      </SelectOption>
    </Select>
  </Tooltip>
</template>
