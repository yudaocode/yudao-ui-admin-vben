<script lang="ts" setup>
import type { MesMdProductBomApi } from '#/api/mes/md/item/productBom';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getProductBomListByItemId } from '#/api/mes/md/item/productBom';

import MdProductBomSelectDialog from './product-bom-select-dialog.vue';

defineOptions({ name: 'MdProductBomSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    itemId?: number;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    itemId: undefined,
    modelValue: undefined,
    placeholder: '请选择 BOM 物料',
  },
);
const emit = defineEmits<{
  change: [bom: MesMdProductBomApi.ProductBom | undefined];
  'update:modelValue': [value: number | undefined];
}>();
const attrs = useAttrs(); // 透传属性
const dialogRef = ref<InstanceType<typeof MdProductBomSelectDialog>>(); // BOM 物料选择弹窗
const hovering = ref(false); // 是否悬停
const selectedBom = ref<MesMdProductBomApi.ProductBom>(); // 当前选中的 BOM 物料

const displayLabel = computed(() => selectedBom.value?.bomItemName ?? ''); // 选择器展示名称
const showClear = computed(
  () =>
    props.clearable &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据 BOM 子物料编号回显选择器 */
async function resolveBomById(bomItemId: number | undefined) {
  if (bomItemId == null || props.itemId == null) {
    selectedBom.value = undefined;
    return;
  }
  if (selectedBom.value?.bomItemId === bomItemId) {
    return;
  }
  const list = await getProductBomListByItemId(props.itemId);
  selectedBom.value = list.find((item) => item.bomItemId === bomItemId);
}

watch(
  () => props.modelValue,
  (value) => {
    resolveBomById(value);
  },
  { immediate: true },
);

watch(
  () => props.itemId,
  () => {
    selectedBom.value = undefined;
    emit('update:modelValue', undefined);
    emit('change', undefined);
  },
);

/** 清空已选 BOM 物料 */
function clearSelected() {
  selectedBom.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开 BOM 物料选择弹窗 */
function handleClick(event: MouseEvent) {
  if (props.disabled || props.itemId == null) {
    return;
  }
  const target = event.target as HTMLElement;
  if (showClear.value && target.closest('.el-input__suffix')) {
    event.stopPropagation();
    clearSelected();
    return;
  }
  dialogRef.value?.open(props.itemId, props.modelValue);
}

/** 回填选中的 BOM 物料 */
function handleSelected(row: MesMdProductBomApi.ProductBom) {
  selectedBom.value = row;
  emit('update:modelValue', row.bomItemId);
  emit('change', row);
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
    <ElTooltip :disabled="!selectedBom" placement="top" :show-after="500">
      <template #content>
        <div v-if="selectedBom" class="leading-6">
          <div>编码：{{ selectedBom.bomItemCode || '-' }}</div>
          <div>名称：{{ selectedBom.bomItemName || '-' }}</div>
          <div>规格：{{ selectedBom.bomItemSpecification || '-' }}</div>
          <div>单位：{{ selectedBom.unitMeasureName || '-' }}</div>
          <div>用量比例：{{ selectedBom.quantity ?? '-' }}</div>
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
  <MdProductBomSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
