<script lang="ts" setup>
import type { MesWmSalesNoticeLineApi } from '#/api/mes/wm/salesnotice/line';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getSalesNoticeLine } from '#/api/mes/wm/salesnotice/line';

import WmSalesNoticeLineSelectDialog from './line-select-dialog.vue';

defineOptions({ name: 'WmSalesNoticeLineSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    noticeId?: number; // 所属发货通知单编号
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    noticeId: undefined,
    placeholder: '请选择发货通知单行',
  },
);

const emit = defineEmits<{
  change: [item: MesWmSalesNoticeLineApi.SalesNoticeLine | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof WmSalesNoticeLineSelectDialog>>();
const hovering = ref(false);
const selectedItem = ref<MesWmSalesNoticeLineApi.SalesNoticeLine>();

const displayLabel = computed(() => {
  const item = selectedItem.value;
  if (!item) {
    return '';
  }
  return `${item.itemCode ?? ''} - ${item.itemName ?? ''}`;
});

const showClear = computed(
  () =>
    props.clearable &&
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
  selectedItem.value = await getSalesNoticeLine(id);
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
  if (showClear.value && target.closest('.el-input__suffix')) {
    event.stopPropagation();
    clearSelected();
    return;
  }
  const selectedIds = props.modelValue == null ? [] : [props.modelValue];
  dialogRef.value?.open(props.noticeId, selectedIds);
}

/** 弹窗选中回调 */
function handleSelected(rows: MesWmSalesNoticeLineApi.SalesNoticeLine[]) {
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
          <div>物料编码：{{ selectedItem.itemCode || '-' }}</div>
          <div>物料名称：{{ selectedItem.itemName || '-' }}</div>
          <div>规格型号：{{ selectedItem.specification || '-' }}</div>
          <div>发货数量：{{ selectedItem.quantity ?? '-' }}</div>
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
  <WmSalesNoticeLineSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
