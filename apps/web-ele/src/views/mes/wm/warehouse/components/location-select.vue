<script lang="ts" setup>
import type { MesWmWarehouseLocationApi } from '#/api/mes/wm/warehouse/location';

import { computed, ref, useAttrs, watch, watchEffect } from 'vue';

import { ElOption, ElSelect, ElTag, ElTooltip } from 'element-plus';

import { getWarehouseLocationSimpleList } from '#/api/mes/wm/warehouse/location';

defineOptions({ name: 'WmWarehouseLocationSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    warehouseId?: number;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择库区',
    warehouseId: undefined,
  },
);

const emit = defineEmits<{
  change: [item: MesWmWarehouseLocationApi.WarehouseLocation | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const allList = ref<MesWmWarehouseLocationApi.WarehouseLocation[]>([]);
const filteredList = ref<MesWmWarehouseLocationApi.WarehouseLocation[]>([]);
const selectedItem = ref<MesWmWarehouseLocationApi.WarehouseLocation>(); // 当前选中的库区对象

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
  allList.value = await getWarehouseLocationSimpleList(props.warehouseId);
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
