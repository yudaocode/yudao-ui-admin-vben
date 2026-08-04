<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { computed, ref, useAttrs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, Tooltip } from 'antdv-next';

import { getEmployeeSimpleList } from '#/api/hrm/employee';

import EmployeeSelectDialog from './employee-select-dialog.vue';

defineOptions({ name: 'HrmEmployeeMultiSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    enabledIds?: number[];
    modelValue?: number[];
    placeholder?: string;
    title?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    enabledIds: undefined,
    modelValue: () => [],
    placeholder: '请选择员工',
    title: '选择员工',
  },
);

const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>();

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
    (props.modelValue?.length || 0) > 0,
);

async function resolveItems(ids: number[]) {
  if (ids.length === 0) {
    selectedItems.value = [];
    return;
  }
  if (
    selectedItems.value.length === ids.length &&
    selectedItems.value.every((item, index) => item.id === ids[index])
  ) {
    return;
  }
  try {
    const items = await getEmployeeSimpleList(ids);
    const itemMap = new Map(items.map((item) => [item.id, item]));
    selectedItems.value = ids
      .map((id) => itemMap.get(id))
      .filter((item): item is HrmEmployeeApi.Employee => item?.id !== null);
  } catch {
    selectedItems.value = [];
  }
}

watch(
  () => props.modelValue,
  (ids) => resolveItems(ids || []),
  { immediate: true, deep: true },
);

function handleClick(event: MouseEvent) {
  if (props.disabled) {
    return;
  }
  const target = event.target as HTMLElement;
  if (showClear.value && target.closest('.ant-input-suffix')) {
    event.stopPropagation();
    selectedItems.value = [];
    emit('update:modelValue', []);
    return;
  }
  dialogRef.value?.open({
    enabledIds: props.enabledIds,
    selectedIds: [...(props.modelValue || [])],
    multiple: true,
    title: props.title,
  });
}

function handleSelected(rows: HrmEmployeeApi.Employee[]) {
  selectedItems.value = rows;
  emit('update:modelValue', rows.map((row) => row.id!).filter(Boolean));
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
