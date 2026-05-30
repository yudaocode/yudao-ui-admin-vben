<script lang="ts" setup>
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';

import { computed, ref, useAttrs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, Tooltip } from 'ant-design-vue';

import { getMaterialStock } from '#/api/mes/wm/materialstock';

import WmMaterialStockSelectDialog from './select-dialog.vue';

defineOptions({ name: 'WmMaterialStockSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    batchId?: number;
    disabled?: boolean;
    itemId?: number;
    modelValue?: number;
    placeholder?: string;
    virtualFilter?: 'all' | 'exclude' | 'only';
    warehouseId?: number;
  }>(),
  {
    allowClear: true,
    batchId: undefined,
    disabled: false,
    itemId: undefined,
    modelValue: undefined,
    placeholder: '请选择库存',
    virtualFilter: 'exclude',
    warehouseId: undefined,
  },
);

const emit = defineEmits<{
  change: [item: MesWmMaterialStockApi.MaterialStock | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof WmMaterialStockSelectDialog>>();
const hovering = ref(false);
const selectedItem = ref<MesWmMaterialStockApi.MaterialStock>();

const displayLabel = computed(() => {
  const item = selectedItem.value;
  if (!item) {
    return '';
  }
  return `${item.warehouseName || '-'} / ${item.batchCode || '-'} / 数量:${item.quantity}`;
});

const showClear = computed(
  () =>
    props.allowClear &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据 ID 单条查询库存信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getMaterialStock(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** 清空已选库存 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开库存选择弹窗 */
function handleClick(event: MouseEvent) {
  if (props.disabled) {
    return;
  }
  const target = event.target as HTMLElement;
  if (showClear.value && target.closest('.ant-input-suffix')) {
    event.stopPropagation();
    clearSelected();
    return;
  }
  const selectedIds = props.modelValue == null ? [] : [props.modelValue];
  dialogRef.value?.open(selectedIds, { multiple: false });
}

/** 弹窗选中回调 */
function handleSelected(rows: MesWmMaterialStockApi.MaterialStock[]) {
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
    <Tooltip :mouse-enter-delay="0.5" :open="selectedItem ? undefined : false">
      <template #title>
        <div v-if="selectedItem" class="leading-6">
          <div>物料：{{ selectedItem.itemName || '-' }}</div>
          <div>批次：{{ selectedItem.batchCode || '-' }}</div>
          <div>数量：{{ selectedItem.quantity ?? '-' }}</div>
          <div>仓库：{{ selectedItem.warehouseName || '-' }}</div>
          <div>库区：{{ selectedItem.locationName || '-' }}</div>
          <div>库位：{{ selectedItem.areaName || '-' }}</div>
        </div>
      </template>
      <Input
        :disabled="disabled"
        :placeholder="placeholder"
        :value="displayLabel"
        readonly
      >
        <template #suffix>
          <IconifyIcon
            class="size-4"
            :icon="showClear ? 'lucide:circle-x' : 'lucide:search'"
          />
        </template>
      </Input>
    </Tooltip>
  </div>
  <WmMaterialStockSelectDialog
    ref="dialogRef"
    :batch-id="batchId"
    :item-id="itemId"
    :virtual-filter="virtualFilter"
    :warehouse-id="warehouseId"
    @selected="handleSelected"
  />
</template>
