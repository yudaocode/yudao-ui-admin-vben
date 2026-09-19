<script lang="ts" setup>
import type { OaVehicleApi } from '#/api/oa/vehicle';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { ElInput } from 'element-plus';

import OaVehicleSelectDialog from './select-dialog.vue';

defineOptions({ name: 'OaVehicleSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean; // 是否允许清空
    disabled?: boolean; // 是否禁用
    modelValue?: number; // 车辆编号
    placeholder?: string; // 占位文本
    selectedVehicle?: OaVehicleApi.Vehicle; // 编辑时回显的车辆
  }>(),
  {
    modelValue: undefined,
    selectedVehicle: undefined,
    disabled: false,
    clearable: true,
    placeholder: '请选择车辆',
  },
);

const emit = defineEmits<{
  change: [item: OaVehicleApi.Vehicle | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const currentVehicle = ref<OaVehicleApi.Vehicle>(); // 本次选中的车辆
const selectDialogRef =
  ref<InstanceType<typeof OaVehicleSelectDialog>>(); // 选择弹窗

/** 当前展示的车辆：优先本次选中，其次编辑回显 */
const selectedItem = computed(() =>
  currentVehicle.value?.id === props.modelValue
    ? currentVehicle.value
    : props.selectedVehicle?.id === props.modelValue
      ? props.selectedVehicle
      : undefined,
);

/** 打开选择弹窗 */
function openSelect() {
  if (props.disabled) {
    return;
  }
  selectDialogRef.value?.open(selectedItem.value);
}

/** 确认选择 */
function handleSelected(item: OaVehicleApi.Vehicle) {
  currentVehicle.value = item;
  emit('update:modelValue', item.id);
  emit('change', item);
}

/** 清空选择 */
function handleClear() {
  currentVehicle.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}
</script>

<template>
  <div class="w-full">
    <ElInput
      readonly
      :model-value="selectedItem?.no || ''"
      :placeholder="placeholder"
      :disabled="disabled"
      @click="openSelect"
    >
      <template #suffix>
        <IconifyIcon
          v-if="clearable && !disabled && modelValue != null"
          class="cursor-pointer"
          icon="ep:circle-close"
          @click.stop="handleClear"
        />
        <IconifyIcon v-else icon="ep:search" />
      </template>
    </ElInput>
    <OaVehicleSelectDialog ref="selectDialogRef" @selected="handleSelected" />
  </div>
</template>
