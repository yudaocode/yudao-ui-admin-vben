<script lang="ts" setup>
import type { MesWmStockTakingPlanApi } from '#/api/mes/wm/stocktaking/plan';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getStockTakingPlan } from '#/api/mes/wm/stocktaking/plan';

import StockTakingPlanSelectDialog from './select-dialog.vue';

defineOptions({ name: 'StockTakingPlanSelect', inheritAttrs: false });

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
    placeholder: '请选择盘点方案',
  },
);

const emit = defineEmits<{
  change: [item: MesWmStockTakingPlanApi.StockTakingPlan | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof StockTakingPlanSelectDialog>>();
const hovering = ref(false);
const selectedItem = ref<MesWmStockTakingPlanApi.StockTakingPlan>();

const displayLabel = computed(() => selectedItem.value?.name ?? '');

const showClear = computed(
  () =>
    props.clearable &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据编号单条查询盘点方案信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getStockTakingPlan(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** 清空已选盘点方案 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开盘点方案选择弹窗 */
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
function handleSelected(rows: MesWmStockTakingPlanApi.StockTakingPlan[]) {
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
          <div>是否盲盘：{{ selectedItem.blindFlag ? '是' : '否' }}</div>
          <div>是否冻结库存：{{ selectedItem.frozen ? '是' : '否' }}</div>
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
  <StockTakingPlanSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
