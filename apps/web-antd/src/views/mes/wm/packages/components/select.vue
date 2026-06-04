<script lang="ts" setup>
import type { MesWmPackageApi } from '#/api/mes/wm/packages';

import { computed, ref, useAttrs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, Tooltip } from 'ant-design-vue';

import { getPackage } from '#/api/mes/wm/packages';

import WmPackageSelectDialog from './select-dialog.vue';

defineOptions({ name: 'WmPackageSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    childableOnly?: boolean; // 只展示可作为子箱的装箱单（无父箱 + 已完成状态）
    disabled?: boolean;
    excludeId?: number; // 排除的编号（避免选择自己作为父箱）
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    childableOnly: false,
    disabled: false,
    excludeId: undefined,
    modelValue: undefined,
    placeholder: '请选择装箱单',
  },
);

const emit = defineEmits<{
  change: [item: MesWmPackageApi.Package | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof WmPackageSelectDialog>>();
const hovering = ref(false);
const selectedItem = ref<MesWmPackageApi.Package>();

const displayLabel = computed(() => selectedItem.value?.code ?? '');

const showClear = computed(
  () =>
    props.allowClear &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据编号单条查询装箱单信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getPackage(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** 清空已选装箱单 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开装箱单选择弹窗 */
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
function handleSelected(rows: MesWmPackageApi.Package[]) {
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
          <div>编号：{{ selectedItem.code || '-' }}</div>
          <div>客户：{{ selectedItem.clientName || '-' }}</div>
          <div>销售订单：{{ selectedItem.salesOrderCode || '-' }}</div>
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
  <WmPackageSelectDialog
    ref="dialogRef"
    :childable-only="childableOnly"
    :exclude-id="excludeId"
    @selected="handleSelected"
  />
</template>
