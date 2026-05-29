<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { computed, ref, useAttrs, watch } from 'vue';

import { CircleX, Search } from '@vben/icons';

import { ElInput, ElTooltip } from 'element-plus';

import { getUser } from '#/api/system/user';

import UserSelectDialog from './select-dialog.vue';

defineOptions({ name: 'UserSelect', inheritAttrs: false });

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
    placeholder: '请选择用户',
  },
);

const emit = defineEmits<{
  change: [item: SystemUserApi.User | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof UserSelectDialog>>();
const hovering = ref(false);
const selectedItem = ref<SystemUserApi.User>();

const displayLabel = computed(
  () => selectedItem.value?.nickname ?? selectedItem.value?.username ?? '',
);

const showClear = computed(
  () =>
    props.clearable &&
    !props.disabled &&
    hovering.value &&
    props.modelValue != null,
);

/** 根据编号单条查询用户信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (id == null) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getUser(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** 清空已选用户 */
function clearSelected() {
  selectedItem.value = undefined;
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
  const selectedIds = props.modelValue == null ? [] : [props.modelValue];
  dialogRef.value?.open(selectedIds, { multiple: false });
}

/** 弹窗选中回调 */
function handleSelected(rows: SystemUserApi.User[]) {
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
          <div>用户名称：{{ selectedItem.username || '-' }}</div>
          <div>用户昵称：{{ selectedItem.nickname || '-' }}</div>
          <div>手机号码：{{ selectedItem.mobile || '-' }}</div>
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
