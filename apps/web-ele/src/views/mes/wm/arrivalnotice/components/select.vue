<script lang="ts" setup>
import type { MesWmArrivalNoticeApi } from '#/api/mes/wm/arrivalnotice';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getArrivalNotice } from '#/api/mes/wm/arrivalnotice';

import WmArrivalNoticeSelectDialog from './select-dialog.vue';

defineOptions({ name: 'WmArrivalNoticeSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    status?: number; // 固定状态筛选
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择到货通知单',
    status: undefined,
  },
);

const emit = defineEmits<{
  change: [item: MesWmArrivalNoticeApi.ArrivalNotice | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof WmArrivalNoticeSelectDialog>>();
const hovering = ref(false);
const selectedItem = ref<MesWmArrivalNoticeApi.ArrivalNotice>();

const displayLabel = computed(() => selectedItem.value?.code ?? '');

const showClear = computed(
  () =>
    props.clearable &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据编号单条查询通知单信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getArrivalNotice(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** 清空已选通知单 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开通知单选择弹窗 */
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
    status: props.status,
  });
}

/** 弹窗选中回调 */
function handleSelected(rows: MesWmArrivalNoticeApi.ArrivalNotice[]) {
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
          <div>编号：{{ selectedItem.code || '-' }}</div>
          <div>名称：{{ selectedItem.name || '-' }}</div>
          <div>供应商：{{ selectedItem.vendorName || '-' }}</div>
          <div>采购订单：{{ selectedItem.purchaseOrderCode || '-' }}</div>
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
  <WmArrivalNoticeSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
