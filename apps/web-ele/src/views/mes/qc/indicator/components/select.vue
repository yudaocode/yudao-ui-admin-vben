<script lang="ts" setup>
import type { MesQcIndicatorApi } from '#/api/mes/qc/indicator';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getIndicator } from '#/api/mes/qc/indicator';

import QcIndicatorSelectDialog from './select-dialog.vue';

defineOptions({ name: 'QcIndicatorSelect', inheritAttrs: false });

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
    placeholder: '请选择质检指标',
  },
);

const emit = defineEmits<{
  change: [item: MesQcIndicatorApi.Indicator | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs(); // 透传属性
const dialogRef = ref<InstanceType<typeof QcIndicatorSelectDialog>>(); // 质检指标选择弹窗
const hovering = ref(false); // 是否悬停
const selectedItem = ref<MesQcIndicatorApi.Indicator>(); // 当前选中指标

const displayLabel = computed(() => selectedItem.value?.name ?? ''); // 选择器展示名称
const showClear = computed(() => // 是否显示清空图标
  props.clearable &&
  !props.disabled &&
  hovering.value &&
  props.modelValue != null,
);

/** 根据 ID 单条查询指标信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getIndicator(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** 清空已选指标 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开质检指标选择弹窗 */
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
function handleSelected(rows: MesQcIndicatorApi.Indicator[]) {
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
          <div>检测工具：{{ selectedItem.tool || '-' }}</div>
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
  <QcIndicatorSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
