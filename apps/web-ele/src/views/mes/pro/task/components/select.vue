<script lang="ts" setup>
import type { MesProTaskApi } from '#/api/mes/pro/task';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getTask } from '#/api/mes/pro/task';

import ProTaskSelectDialog from './select-dialog.vue';

defineOptions({ name: 'ProTaskSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    statuses?: number[];
    workOrderId?: number;
    workstationId?: number;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
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
const attrs = useAttrs(); // 透传属性
const dialogRef = ref<InstanceType<typeof ProTaskSelectDialog>>(); // 任务选择弹窗
const hovering = ref(false); // 是否悬停
const selectedItem = ref<MesProTaskApi.Task>(); // 选中的任务

const displayLabel = computed(() => selectedItem.value?.code ?? ''); // 选择器展示编号
const showClear = computed(() => // 是否显示清空图标
  props.clearable &&
  !props.disabled &&
  hovering.value &&
  props.modelValue != null,
);

/** 根据任务编号回显选择器 */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getTask(id);
}

watch(
  () => props.modelValue,
  (value) => {
    resolveItemById(value);
  },
  { immediate: true },
);

/** 清空已选任务 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开任务选择弹窗 */
function handleClick(event: MouseEvent) {
  if (props.disabled) {
    return;
  }
  const target = event.target as HTMLElement;
  if (showClear.value && target.closest('.el-input__suffix')) {
    event.stopPropagation();
    clearSelected();
    return;
  }
  const selectedIds = props.modelValue == null ? [] : [props.modelValue];
  dialogRef.value?.open(selectedIds, {
    multiple: false,
    workOrderId: props.workOrderId,
    workstationId: props.workstationId,
  });
}

/** 回填选中的任务 */
function handleSelected(rows: MesProTaskApi.Task[]) {
  const item = rows[0];
  if (!item) {
    return;
  }
  selectedItem.value = item;
  emit('update:modelValue', item.id);
  emit('change', item);
}
</script>

<template>
  <div
    v-bind="attrs"
    class="w-full"
    :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'"
    @click="handleClick"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <ElTooltip :disabled="!selectedItem" placement="top" :show-after="500">
      <template #content>
        <div v-if="selectedItem" class="leading-6">
          <div>任务编号：{{ selectedItem.code || '-' }}</div>
          <div>任务名称：{{ selectedItem.name || '-' }}</div>
          <div>工序：{{ selectedItem.processName || '-' }}</div>
          <div>工作站：{{ selectedItem.workstationName || '-' }}</div>
          <div>物料：{{ selectedItem.itemName || '-' }}</div>
          <div>规格：{{ selectedItem.itemSpecification || '-' }}</div>
        </div>
      </template>
      <ElInput
        :disabled="disabled"
        :model-value="displayLabel"
        :placeholder="placeholder"
        readonly
      >
        <template #suffix>
          <CircleX v-if="showClear" class="size-4" />
          <Search v-else class="size-4" />
        </template>
      </ElInput>
    </ElTooltip>
  </div>
  <ProTaskSelectDialog
    ref="dialogRef"
    :statuses="statuses"
    @selected="handleSelected"
  />
</template>
