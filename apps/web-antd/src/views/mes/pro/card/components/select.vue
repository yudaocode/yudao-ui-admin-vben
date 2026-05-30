<script lang="ts" setup>
import type { MesProCardApi } from '#/api/mes/pro/card';

import { computed, ref, useAttrs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, Tooltip } from 'ant-design-vue';

import { getCard } from '#/api/mes/pro/card';

import ProCardSelectDialog from './select-dialog.vue';

defineOptions({ name: 'ProCardSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择流转卡',
  },
);

const emit = defineEmits<{
  change: [item: MesProCardApi.Card | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof ProCardSelectDialog>>();
const hovering = ref(false);
const selectedItem = ref<MesProCardApi.Card>();

const displayLabel = computed(() => selectedItem.value?.code ?? '');

const showClear = computed(
  () =>
    props.allowClear &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据编号单条查询流转卡信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getCard(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** 清空已选流转卡 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开流转卡选择弹窗 */
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
function handleSelected(rows: MesProCardApi.Card[]) {
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
          <div>工单：{{ selectedItem.workOrderCode || '-' }}</div>
          <div>批次：{{ selectedItem.batchCode || '-' }}</div>
          <div>产品：{{ selectedItem.itemName || '-' }}</div>
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
  <ProCardSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
