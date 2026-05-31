<script lang="ts" setup>
import type { MesMdWorkstationApi } from '#/api/mes/md/workstation';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getWorkstation } from '#/api/mes/md/workstation';

import MdWorkstationSelectDialog from './select-dialog.vue';

defineOptions({ name: 'MdWorkstationSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    processId?: number;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择工作站',
    processId: undefined,
  },
);
const emit = defineEmits<{
  change: [item: MesMdWorkstationApi.Workstation | undefined];
  'update:modelValue': [value: number | undefined];
}>();
const attrs = useAttrs(); // 透传属性
const dialogRef = ref<InstanceType<typeof MdWorkstationSelectDialog>>(); // 工作站选择弹窗
const hovering = ref(false); // 是否悬停
const selectedItem = ref<MesMdWorkstationApi.Workstation>(); // 选中的工作站

const displayLabel = computed(() => selectedItem.value?.name ?? ''); // 选择器展示名称
const showClear = computed(
  () =>
    props.clearable &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据工作站编号回显选择器 */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getWorkstation(id);
}

watch(
  () => props.modelValue,
  (value) => {
    resolveItemById(value);
  },
  { immediate: true },
);

/** 清空已选工作站 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开工作站选择弹窗 */
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

/** 回填选中的工作站 */
function handleSelected(rows: MesMdWorkstationApi.Workstation[]) {
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
          <div>所在车间：{{ selectedItem.workshopName || '-' }}</div>
          <div>所属工序：{{ selectedItem.processName || '-' }}</div>
          <div>地点：{{ selectedItem.address || '-' }}</div>
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
  <MdWorkstationSelectDialog
    ref="dialogRef"
    :process-id="processId"
    @selected="handleSelected"
  />
</template>
