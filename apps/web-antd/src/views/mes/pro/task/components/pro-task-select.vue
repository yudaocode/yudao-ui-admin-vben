<script lang="ts" setup>
import type { MesProTaskApi } from '#/api/mes/pro/task';

import { computed, onMounted, ref, watch } from 'vue';

import { Select, Tag, Tooltip } from 'ant-design-vue';

import { getTask, getTaskPage } from '#/api/mes/pro/task';

// TODO @AI：直接完整迁移！
/**
 * MES 生产任务选择器（轻量版）
 *
 * 当前用于生产报工等只需要单选任务 ID 的业务页面：
 * - 默认按 `workOrderId` / `workstationId` / `statuses` 过滤拉取首页 100 条任务作为下拉
 * - 编辑回显走 `getTask(id)`
 * - 后续 `mes/pro/task` 完整迁移后，可替换为带弹窗的复杂选择器
 */
defineOptions({ name: 'ProTaskSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    pageSize?: number;
    placeholder?: string;
    statuses?: number[];
    workOrderId?: number;
    workstationId?: number;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    pageSize: 100,
    placeholder: '请选择任务',
    statuses: undefined,
    workOrderId: undefined,
    workstationId: undefined,
  },
);

const emit = defineEmits<{
  change: [item: MesProTaskApi.Task | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const allList = ref<MesProTaskApi.Task[]>([]);
const selectedItem = ref<MesProTaskApi.Task>();

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

/** 前端过滤：按任务编号或名称模糊匹配 */
function handleFilter(input: string, option: any) {
  const keyword = input.toLowerCase();
  const item = option?.item as MesProTaskApi.Task | undefined;
  return Boolean(
    item?.code?.toLowerCase().includes(keyword) ||
      item?.name?.toLowerCase().includes(keyword),
  );
}

/** 同步选中任务详情，未在列表内时单独拉取 */
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
    selectedItem.value = await getTask(value);
  } catch (error) {
    console.error('[ProTaskSelect] resolveItemById failed:', error);
  }
}

/** 除 v-model 外，额外抛出完整任务对象给业务表单使用 */
function handleChange(value: any) {
  const nextValue = value === undefined ? undefined : Number(value);
  syncSelectedItem(nextValue);
  emit('change', selectedItem.value);
}

/** 重新拉取候选任务列表 */
async function loadList() {
  const data = await getTaskPage({
    pageNo: 1,
    pageSize: props.pageSize,
    statuses: props.statuses,
    workOrderId: props.workOrderId,
    workstationId: props.workstationId,
  });
  allList.value = data.list ?? [];
}

watch(
  () => props.modelValue,
  (value) => {
    syncSelectedItem(value);
  },
);

watch(
  () => [props.workOrderId, props.workstationId],
  async () => {
    await loadList();
    syncSelectedItem(props.modelValue);
  },
);

onMounted(async () => {
  await loadList();
  syncSelectedItem(props.modelValue);
});
</script>

<template>
  <Tooltip :mouse-enter-delay="0.5" :open="selectedItem ? undefined : false">
    <template #title>
      <div v-if="selectedItem" class="leading-6">
        <div>任务编号：{{ selectedItem.code || '-' }}</div>
        <div>任务名称：{{ selectedItem.name || '-' }}</div>
        <div>工序：{{ selectedItem.processName || '-' }}</div>
        <div>工作站：{{ selectedItem.workstationName || '-' }}</div>
        <div>物料：{{ selectedItem.itemName || '-' }}</div>
        <div>规格：{{ selectedItem.itemSpecification || '-' }}</div>
      </div>
    </template>
    <Select
      v-bind="$attrs"
      v-model:value="selectValue"
      :allow-clear="allowClear"
      :disabled="disabled"
      :filter-option="handleFilter"
      :placeholder="placeholder"
      class="w-full"
      show-search
      @change="handleChange"
    >
      <Select.Option
        v-for="item in allList"
        :key="item.id"
        :item="item"
        :value="item.id"
      >
        <div class="flex items-center gap-2">
          <span>{{ item.code }}</span>
          <Tag v-if="item.itemName" color="default">{{ item.itemName }}</Tag>
        </div>
      </Select.Option>
    </Select>
  </Tooltip>
</template>
