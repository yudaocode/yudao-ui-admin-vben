<script lang="ts" setup>
import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getWorkOrder } from '#/api/mes/pro/workorder';

import ProWorkOrderSelectDialog from './select-dialog.vue';

defineOptions({ name: 'ProWorkOrderSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    status?: number;
    type?: number;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择工单',
    status: undefined,
    type: undefined,
  },
);

const emit = defineEmits<{
  change: [item: MesProWorkOrderApi.WorkOrder | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs(); // 透传属性
const dialogRef = ref<InstanceType<typeof ProWorkOrderSelectDialog>>(); // 工单选择弹窗
const hovering = ref(false); // 是否悬停
const selectedItem = ref<MesProWorkOrderApi.WorkOrder>(); // 当前选中工单

const displayLabel = computed(() => selectedItem.value?.code ?? ''); // 选择器展示编码
const showClear = computed(() => // 是否显示清空图标
  props.clearable &&
  !props.disabled &&
  hovering.value &&
  props.modelValue != null,
);

/** 根据编号单条查询工单信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getWorkOrder(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** 清空已选工单 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开工单选择弹窗 */
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
  dialogRef.value?.open(selectedIds, { multiple: false });
}

/** 弹窗选中回调 */
function handleSelected(rows: MesProWorkOrderApi.WorkOrder[]) {
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
          <div>编码：{{ selectedItem.code || '-' }}</div>
          <div>名称：{{ selectedItem.name || '-' }}</div>
          <div>产品：{{ selectedItem.productName || '-' }}</div>
          <div>数量：{{ selectedItem.quantity ?? '-' }}</div>
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
  <ProWorkOrderSelectDialog
    ref="dialogRef"
    :status="status"
    :type="type"
    @selected="handleSelected"
  />
</template>
