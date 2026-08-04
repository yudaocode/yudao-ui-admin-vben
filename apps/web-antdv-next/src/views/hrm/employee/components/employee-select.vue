<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { computed, ref, useAttrs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, Tooltip } from 'antdv-next';

import { getEmployeeSimpleList } from '#/api/hrm/employee';

import EmployeeSelectDialog from './employee-select-dialog.vue';

defineOptions({ name: 'HrmEmployeeSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    disabledIds?: number[];
    entryStatus?: number;
    modelValue?: number | number[];
    multiple?: boolean;
    placeholder?: string;
    title?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    disabledIds: () => [],
    entryStatus: undefined,
    modelValue: undefined,
    multiple: false,
    placeholder: '请选择员工',
    title: '选择员工',
  },
);

const emit = defineEmits<{
  change: [value: HrmEmployeeApi.Employee | undefined];
  'update:modelValue': [value: number | number[] | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof EmployeeSelectDialog>>();
const hovering = ref(false);
const selectedItems = ref<HrmEmployeeApi.Employee[]>([]);

const displayLabel = computed(() =>
  selectedItems.value.map((item) => item.name).join('、'),
);
const showClear = computed(
  () =>
    props.allowClear &&
    !props.disabled &&
    hovering.value &&
    props.modelValue !== undefined,
);

async function resolveItems(value?: number | number[]) {
  const ids = Array.isArray(value) ? value : value === undefined ? [] : [value];
  if (ids.length === 0) {
    selectedItems.value = [];
    return;
  }
  if (
    selectedItems.value.length === ids.length &&
    selectedItems.value.every((item) => ids.includes(item.id!))
  ) {
    return;
  }
  try {
    const items = await getEmployeeSimpleList(ids);
    selectedItems.value = items;
  } catch {
    selectedItems.value = [];
  }
}

watch(() => props.modelValue, resolveItems, { immediate: true });

function handleClick(event: MouseEvent) {
  if (props.disabled) {
    return;
  }
  const target = event.target as HTMLElement;
  if (showClear.value && target.closest('.ant-input-suffix')) {
    event.stopPropagation();
    selectedItems.value = [];
    emit('update:modelValue', undefined);
    emit('change', undefined);
    return;
  }
  dialogRef.value?.open({
    selectedIds: Array.isArray(props.modelValue)
      ? props.modelValue
      : props.modelValue
        ? [props.modelValue]
        : [],
    disabledIds: props.disabledIds,
    entryStatus: props.entryStatus,
    multiple: props.multiple,
    title: props.title,
  });
}

function handleSelected(rows: HrmEmployeeApi.Employee[]) {
  const row = rows[0];
  selectedItems.value = props.multiple ? rows : row ? [row] : [];
  emit(
    'update:modelValue',
    props.multiple ? rows.map((item) => item.id!) : row?.id,
  );
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
    <Tooltip :title="displayLabel" :open="displayLabel ? undefined : false">
      <Input
        :disabled="disabled"
        :placeholder="placeholder"
        :value="displayLabel"
        readonly
      >
        <template #suffix>
          <IconifyIcon
            v-if="showClear"
            class="text-muted-foreground"
            icon="lucide:circle-x"
          />
          <IconifyIcon
            v-else
            class="text-muted-foreground"
            icon="lucide:search"
          />
        </template>
      </Input>
    </Tooltip>
    <EmployeeSelectDialog ref="dialogRef" @selected="handleSelected" />
  </div>
</template>
