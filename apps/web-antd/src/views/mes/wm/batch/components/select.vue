<script lang="ts" setup>
import type { MesWmBatchApi } from '#/api/mes/wm/batch';

import { computed, ref, useAttrs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, Tooltip } from 'ant-design-vue';

import { getBatch } from '#/api/mes/wm/batch';

import WmBatchSelectDialog from './select-dialog.vue';

defineOptions({ name: 'WmBatchSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    clientId?: number; // 默认过滤的客户 ID
    disabled?: boolean;
    itemId?: number; // 默认过滤的物料 ID
    modelValue?: number;
    placeholder?: string;
    salesOrderCode?: string; // 默认过滤的销售订单编号
    vendorId?: number; // 默认过滤的供应商 ID
  }>(),
  {
    allowClear: true,
    clientId: undefined,
    disabled: false,
    itemId: undefined,
    modelValue: undefined,
    placeholder: '请选择批次',
    salesOrderCode: undefined,
    vendorId: undefined,
  },
);

const emit = defineEmits<{
  change: [item: MesWmBatchApi.Batch | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof WmBatchSelectDialog>>();
const hovering = ref(false);
const selectedItem = ref<MesWmBatchApi.Batch>();

const displayLabel = computed(() => selectedItem.value?.code ?? '');

const showClear = computed(
  () =>
    props.allowClear &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据编号单条查询批次信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getBatch(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** 清空已选批次 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开批次选择弹窗 */
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
  dialogRef.value?.open(selectedIds, {
    clientId: props.clientId,
    itemId: props.itemId,
    multiple: false,
    salesOrderCode: props.salesOrderCode,
    vendorId: props.vendorId,
  });
}

/** 弹窗选中回调 */
function handleSelected(rows: MesWmBatchApi.Batch[]) {
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
          <div>批次编号：{{ selectedItem.code || '-' }}</div>
          <div>物料编码：{{ selectedItem.itemCode || '-' }}</div>
          <div>物料名称：{{ selectedItem.itemName || '-' }}</div>
          <div>生产批号：{{ selectedItem.lotNumber || '-' }}</div>
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
  <WmBatchSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
