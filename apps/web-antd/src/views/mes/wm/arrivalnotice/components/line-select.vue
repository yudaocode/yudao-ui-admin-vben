<script lang="ts" setup>
import type { MesWmArrivalNoticeLineApi } from '#/api/mes/wm/arrivalnotice/line';

import { computed, ref, useAttrs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, Tooltip } from 'ant-design-vue';

import { getArrivalNoticeLine } from '#/api/mes/wm/arrivalnotice/line';

import WmArrivalNoticeLineSelectDialog from './line-select-dialog.vue';

defineOptions({ name: 'WmArrivalNoticeLineSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    noticeId?: number; // 所属到货通知单编号
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    noticeId: undefined,
    placeholder: '请选择到货通知单行',
  },
);

const emit = defineEmits<{
  change: [item: MesWmArrivalNoticeLineApi.ArrivalNoticeLine | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof WmArrivalNoticeLineSelectDialog>>();
const hovering = ref(false);
const selectedItem = ref<MesWmArrivalNoticeLineApi.ArrivalNoticeLine>();

const displayLabel = computed(() => {
  const item = selectedItem.value;
  if (!item) {
    return '';
  }
  return `${item.itemCode ?? ''} - ${item.itemName ?? ''}`;
});

const showClear = computed(
  () =>
    props.allowClear &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据编号单条查询行信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getArrivalNoticeLine(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** noticeId 变化时清空选中（关联的行已失效） */
watch(
  () => props.noticeId,
  () => {
    selectedItem.value = undefined;
    emit('update:modelValue', undefined);
    emit('change', undefined);
  },
);

/** 清空已选行 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开行选择弹窗 */
function handleClick(event: MouseEvent) {
  if (props.disabled || !props.noticeId) {
    return;
  }
  const target = event.target as HTMLElement;
  if (showClear.value && target.closest('.ant-input-suffix')) {
    event.stopPropagation();
    clearSelected();
    return;
  }
  const selectedIds = props.modelValue == null ? [] : [props.modelValue];
  dialogRef.value?.open(props.noticeId, selectedIds);
}

/** 弹窗选中回调 */
function handleSelected(rows: MesWmArrivalNoticeLineApi.ArrivalNoticeLine[]) {
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
          <div>物料编码：{{ selectedItem.itemCode || '-' }}</div>
          <div>物料名称：{{ selectedItem.itemName || '-' }}</div>
          <div>规格型号：{{ selectedItem.specification || '-' }}</div>
          <div>到货数量：{{ selectedItem.arrivalQuantity ?? '-' }}</div>
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
  <WmArrivalNoticeLineSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
