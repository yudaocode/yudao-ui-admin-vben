<script lang="ts" setup>
import type { MesDvMachineryApi } from '#/api/mes/dv/machinery';

import { computed, ref, useAttrs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, Tooltip } from 'ant-design-vue';

import { getMachinery } from '#/api/mes/dv/machinery';

import DvMachinerySelectDialog from './select-dialog.vue';

defineOptions({ name: 'DvMachinerySelect', inheritAttrs: false });

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
    placeholder: '请选择设备',
  },
);
const emit = defineEmits<{
  change: [item: MesDvMachineryApi.Machinery | undefined];
  'update:modelValue': [value: number | undefined];
}>();
const attrs = useAttrs(); // 透传属性
const dialogRef = ref<InstanceType<typeof DvMachinerySelectDialog>>(); // 设备选择弹窗
const hovering = ref(false); // 是否悬停
const selectedItem = ref<MesDvMachineryApi.Machinery>(); // 当前选中设备

const displayLabel = computed(() => selectedItem.value?.name ?? ''); // 选择器展示名称
const showClear = computed(
  () =>
    props.allowClear &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据设备编号回显选择器 */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getMachinery(id);
}

watch(
  () => props.modelValue,
  (value) => {
    resolveItemById(value);
  },
  { immediate: true },
);

/** 清空已选设备 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开设备选择弹窗 */
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

/** 回填选中的设备 */
function handleSelected(rows: MesDvMachineryApi.Machinery[]) {
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
          <div>设备编码：{{ selectedItem.code || '-' }}</div>
          <div>设备名称：{{ selectedItem.name || '-' }}</div>
          <div v-if="selectedItem.brand">品牌：{{ selectedItem.brand }}</div>
          <div v-if="selectedItem.specification">
            规格型号：{{ selectedItem.specification }}
          </div>
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
  <DvMachinerySelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
