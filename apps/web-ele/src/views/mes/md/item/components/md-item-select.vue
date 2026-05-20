<script lang="ts" setup>
import type { MesMdItemApi } from '#/api/mes/md/item';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getItem } from '#/api/mes/md/item';

import MdItemSelectDialog from './md-item-select-dialog.vue';

defineOptions({ name: 'MdItemSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择产品物料',
  },
);
const emit = defineEmits<{
  change: [item: MesMdItemApi.Item | undefined];
  'update:modelValue': [value: number | undefined];
}>();
const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof MdItemSelectDialog>>();
const hovering = ref(false);
const selectedItem = ref<MesMdItemApi.Item>();

const displayLabel = computed(() => selectedItem.value?.name ?? '');
const showClear = computed(
  () => props.clearable && !props.disabled && hovering.value && props.modelValue != null,
);

async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  try {
    selectedItem.value = await getItem(id);
  } catch (error) {
    console.error('[MdItemSelect] resolveItemById failed:', error);
  }
}

watch(
  () => props.modelValue,
  (value) => {
    resolveItemById(value);
  },
  { immediate: true },
);

function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

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

function handleSelected(rows: MesMdItemApi.Item[]) {
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
          <div>规格：{{ selectedItem.specification || '-' }}</div>
          <div>单位：{{ selectedItem.unitMeasureName || '-' }}</div>
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
  <MdItemSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
