<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getUserList } from '#/api/system/user';

import UserSelectDialog from './select-dialog.vue';

defineOptions({ name: 'UserSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: null | number | number[];
    multiple?: boolean;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    multiple: false,
    placeholder: '请选择用户',
  },
);

const emit = defineEmits<{
  change: [item: SystemUserApi.User | SystemUserApi.User[] | undefined];
  'update:modelValue': [value: number | number[] | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof UserSelectDialog>>();
const hovering = ref(false);
const selectedItems = ref<SystemUserApi.User[]>([]);

const displayLabel = computed(() =>
  selectedItems.value
    .map((item) => item.nickname || item.username || item.id)
    .join('、'),
);

const showClear = computed(
  () => props.clearable && !props.disabled && hovering.value && hasValue(),
);

/** 获取已选用户编号 */
function getSelectedIds(value: null | number | number[] | undefined) {
  if (Array.isArray(value)) {
    return props.multiple ? value : value.slice(0, 1);
  }
  return value === null || value === undefined ? [] : [value];
}

/** 是否已有选中值 */
function hasValue() {
  return getSelectedIds(props.modelValue).length > 0;
}

/** 根据编号查询用户信息（用于编辑回显） */
async function resolveItemsById(value: null | number | number[] | undefined) {
  const ids = getSelectedIds(value);
  if (ids.length === 0) {
    selectedItems.value = [];
    return;
  }
  if (
    selectedItems.value.length === ids.length &&
    selectedItems.value.every(
      (item) => item.id !== undefined && ids.includes(item.id),
    )
  ) {
    return;
  }
  const userList = await getUserList(ids);
  const userMap = new Map(userList.map((item) => [item.id, item]));
  selectedItems.value = ids
    .map((id) => userMap.get(id))
    .filter((item): item is SystemUserApi.User => !!item);
}

watch(() => props.modelValue, resolveItemsById, { deep: true, immediate: true });

/** 清空已选用户 */
function clearSelected() {
  selectedItems.value = [];
  if (props.multiple) {
    emit('update:modelValue', []);
    emit('change', []);
    return;
  }
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开用户选择弹窗 */
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
  dialogRef.value?.open(getSelectedIds(props.modelValue), {
    multiple: props.multiple,
  });
}

/** 弹窗选中回调 */
function handleSelected(rows: SystemUserApi.User[]) {
  if (rows.length === 0) {
    return;
  }
  if (props.multiple) {
    selectedItems.value = rows;
    emit(
      'update:modelValue',
      rows
        .map((item) => item.id)
        .filter((id): id is number => id !== undefined),
    );
    emit('change', rows);
    return;
  }
  const item = rows[0]!;
  selectedItems.value = [item];
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
    <ElTooltip :disabled="selectedItems.length === 0" placement="top" :show-after="500">
      <template #content>
        <div v-if="selectedItems.length > 0" class="flex gap-3">
          <div
            v-for="selectedItem in selectedItems"
            :key="selectedItem.id"
            class="leading-6"
          >
            <div>用户名称：{{ selectedItem.username || '-' }}</div>
            <div>用户昵称：{{ selectedItem.nickname || '-' }}</div>
            <div>部门：{{ selectedItem.deptName || '-' }}</div>
            <div>手机号码：{{ selectedItem.mobile || '-' }}</div>
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
  <UserSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
