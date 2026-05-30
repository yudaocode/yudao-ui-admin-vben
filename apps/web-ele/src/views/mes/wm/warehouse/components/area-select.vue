<script lang="ts" setup>
import type { MesWmWarehouseAreaApi } from '#/api/mes/wm/warehouse/area';

import { computed, ref, useAttrs, watch, watchEffect } from 'vue';

import { ElOption, ElSelect, ElTag, ElTooltip } from 'element-plus';

import { getWarehouseAreaSimpleList } from '#/api/mes/wm/warehouse/area';

defineOptions({ name: 'WmWarehouseAreaSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    locationId?: number;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    clearable: true,
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
const filteredList = ref<MesWmWarehouseAreaApi.WarehouseArea[]>([]);
const selectedItem = ref<MesWmWarehouseAreaApi.WarehouseArea>(); // 当前选中的库位对象

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
function filterMethod(query: string) {
  const keyword = query.toLowerCase();
  filteredList.value = query
    ? allList.value.filter(
        (item) =>
          !!item.name?.toLowerCase().includes(keyword) ||
          !!item.code?.toLowerCase().includes(keyword),
      )
    : allList.value;
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

watchEffect(async () => {
  allList.value = await getWarehouseAreaSimpleList(props.locationId);
  filteredList.value = allList.value;
  if (props.modelValue != null) {
    selectedItem.value = allList.value.find((o) => o.id === props.modelValue);
  }
});
</script>

<template>
  <ElTooltip :disabled="!selectedItem" placement="top" :show-after="500">
    <template #content>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>所属仓库：{{ selectedItem.warehouseName || '-' }}</div>
        <div>所属库区：{{ selectedItem.locationName || '-' }}</div>
      </div>
    </template>
    <ElSelect
      v-bind="attrs"
      v-model="selectValue"
      class="!w-full"
      :clearable="clearable"
      :disabled="disabled"
      filterable
      :filter-method="filterMethod"
      :placeholder="placeholder"
      @change="handleChange"
    >
      <ElOption
        v-for="item in filteredList"
        :key="item.id"
        :label="item.name"
        :value="item.id!"
      >
        <div class="flex items-center gap-2">
          <span>{{ item.name }}</span>
          <ElTag v-if="item.code" size="small" type="info">
            编号: {{ item.code }}
          </ElTag>
        </div>
      </ElOption>
    </ElSelect>
  </ElTooltip>
</template>
