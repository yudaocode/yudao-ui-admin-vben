<script lang="ts" setup>
import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';

import { computed, onMounted, ref, watch } from 'vue';

import { ElOption, ElSelect, ElTag, ElTooltip } from 'element-plus';

import { getWorkOrder, getWorkOrderPage } from '#/api/mes/pro/workorder';

/**
 * MES 生产工单选择器（轻量版）
 *
 * 当前用于安灯记录等只需要单选工单 ID 的业务页面：
 * - 默认按 `status` 过滤拉取首页 100 条工单作为下拉
 * - 编辑回显走 `getWorkOrder(id)`
 * - 后续 `mes/pro/workorder` 完整迁移后，可替换为带弹窗的复杂选择器
 */
defineOptions({ name: 'ProWorkOrderSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    pageSize?: number;
    placeholder?: string;
    status?: number;
    type?: number;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    pageSize: 100,
    placeholder: '请选择工单',
    status: undefined,
    type: undefined,
  },
);

const emit = defineEmits<{
  change: [item: MesProWorkOrderApi.WorkOrder | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const allList = ref<MesProWorkOrderApi.WorkOrder[]>([]);
const filteredList = ref<MesProWorkOrderApi.WorkOrder[]>([]);
const selectedItem = ref<MesProWorkOrderApi.WorkOrder>();

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

function handleFilter(query: string) {
  if (!query) {
    filteredList.value = allList.value;
    return;
  }
  const keyword = query.toLowerCase();
  filteredList.value = allList.value.filter(
    (item) =>
      item.code?.toLowerCase().includes(keyword) ||
      item.name?.toLowerCase().includes(keyword),
  );
}

/** 同步选中工单详情，未在列表内时单独拉取 */
async function syncSelectedItem(value: number | undefined) {
  if (value === undefined) {
    selectedItem.value = undefined;
    return;
  }
  const found = allList.value.find((item) => item.id === value);
  if (found) {
    selectedItem.value = found;
    return;
  }
  try {
    selectedItem.value = await getWorkOrder(value);
  } catch (error) {
    console.error('[ProWorkOrderSelect] resolveItemById failed:', error);
  }
}

/** 除 v-model 外，额外抛出完整工单对象给业务表单使用 */
function handleChange(value: number | undefined) {
  syncSelectedItem(value);
  emit('change', selectedItem.value);
}

watch(
  () => props.modelValue,
  (value) => {
    syncSelectedItem(value);
  },
);

onMounted(async () => {
  const data = await getWorkOrderPage({
    pageNo: 1,
    pageSize: props.pageSize,
    status: props.status,
    type: props.type,
  });
  allList.value = data.list ?? [];
  filteredList.value = allList.value;
  syncSelectedItem(props.modelValue);
});
</script>

<template>
  <ElTooltip :disabled="!selectedItem" placement="top" :show-after="500">
    <template #content>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>产品：{{ selectedItem.productName || '-' }}</div>
        <div>数量：{{ selectedItem.quantity ?? '-' }}</div>
      </div>
    </template>
    <ElSelect
      v-bind="$attrs"
      v-model="selectValue"
      :clearable="clearable"
      :disabled="disabled"
      :filter-method="handleFilter"
      :placeholder="placeholder"
      class="w-full"
      filterable
      @change="handleChange"
    >
      <ElOption
        v-for="item in filteredList"
        :key="item.id"
        :label="item.code"
        :value="item.id!"
      >
        <div class="flex items-center gap-2">
          <span>{{ item.code }}</span>
          <ElTag v-if="item.name" size="small" type="info">
            {{ item.name }}
          </ElTag>
        </div>
      </ElOption>
    </ElSelect>
  </ElTooltip>
</template>
