<script lang="ts" setup>
import type { MesDvCheckPlanApi } from '#/api/mes/dv/checkplan';

import { computed, ref, useAttrs, watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getCheckPlan } from '#/api/mes/dv/checkplan';
import { DictTag } from '#/components/dict-tag';

import DvCheckPlanSelectDialog from './select-dialog.vue';

defineOptions({ name: 'DvCheckPlanSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    status?: number;
    type?: number;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择保养方案',
    status: undefined,
    type: undefined,
  },
);
const emit = defineEmits<{
  change: [item: MesDvCheckPlanApi.CheckPlan | undefined];
  'update:modelValue': [value: number | undefined];
}>();
const attrs = useAttrs(); // 透传属性
const dialogRef = ref<InstanceType<typeof DvCheckPlanSelectDialog>>(); // 方案选择弹窗
const hovering = ref(false); // 是否悬停
const selectedItem = ref<MesDvCheckPlanApi.CheckPlan>(); // 当前选中方案

const displayLabel = computed(() => selectedItem.value?.name ?? ''); // 选择器展示名称
const showClear = computed(
  () =>
    props.clearable &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据方案编号回显选择器 */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getCheckPlan(id);
}

watch(
  () => props.modelValue,
  (value) => {
    resolveItemById(value);
  },
  { immediate: true },
);

/** 清空已选方案 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开方案选择弹窗 */
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
    type: props.type,
  });
}

/** 回填选中的方案 */
function handleSelected(rows: MesDvCheckPlanApi.CheckPlan[]) {
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
          <div class="flex items-center">
            频度：{{ selectedItem.cycleCount ?? '-' }}
            <DictTag
              class="ml-1"
              :type="DICT_TYPE.MES_DV_CYCLE_TYPE"
              :value="selectedItem.cycleType"
            />
          </div>
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
  <DvCheckPlanSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
