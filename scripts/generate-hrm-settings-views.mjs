/**
 * Generate HRM settings menus #20-#27 views for web-antd.
 * Run: node scripts/generate-hrm-settings-views.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('apps/web-antd/src');
const w = (rel, content) => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trimStart());
};

// shared employee multi select
w(
  'views/hrm/employee/components/employee-multi-select.vue',
  `
<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Input, Tooltip } from 'ant-design-vue';

import { getEmployeeSimpleList } from '#/api/hrm/employee';

import EmployeeSelectDialog from './employee-select-dialog.vue';

defineOptions({ name: 'HrmEmployeeMultiSelect' });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number[];
    placeholder?: string;
    title?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: () => [],
    placeholder: '请选择员工',
    title: '选择员工',
  },
);

const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>();

const dialogRef = ref<InstanceType<typeof EmployeeSelectDialog>>();
const selectedItems = ref<HrmEmployeeApi.Employee[]>([]);

const displayLabel = computed(() =>
  selectedItems.value.map((item) => item.name).join('、'),
);

async function resolveItems(ids: number[]) {
  if (!ids.length) {
    selectedItems.value = [];
    return;
  }
  selectedItems.value = await getEmployeeSimpleList(ids);
}

watch(() => props.modelValue, (ids) => resolveItems(ids || []), { immediate: true, deep: true });

function openDialog() {
  if (props.disabled) return;
  dialogRef.value?.open({
    selectedIds: [...(props.modelValue || [])],
    multiple: true,
    title: props.title,
  });
}

function handleSelected(rows: HrmEmployeeApi.Employee[]) {
  selectedItems.value = rows;
  emit('update:modelValue', rows.map((row) => row.id!).filter(Boolean));
}

function handleClear() {
  selectedItems.value = [];
  emit('update:modelValue', []);
}
</script>

<template>
  <div class="flex w-full items-center gap-2">
    <Tooltip :title="displayLabel" :open="displayLabel ? undefined : false">
      <Input :disabled="disabled" :placeholder="placeholder" :value="displayLabel" readonly />
    </Tooltip>
    <Button :disabled="disabled" @click="openDialog">选择</Button>
    <Button v-if="allowClear && modelValue?.length" :disabled="disabled" @click="handleClear">
      清空
    </Button>
    <EmployeeSelectDialog ref="dialogRef" @selected="handleSelected" />
  </div>
</template>
`,
);

console.log('Generated shared components');
console.log('Done - extend script for remaining views');
