<script lang="ts" setup>
import type { ImManagerGroupApi } from '#/api/im/manager/group';

import { computed, ref, useAttrs, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { isUndefined } from '@vben/utils';

import { Input, Tooltip } from 'antdv-next';

import { getManagerGroup } from '#/api/im/manager/group';

import GroupSelectDialog from './select-dialog.vue';

defineOptions({ name: 'ImManagerGroupSelect', inheritAttrs: false });

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
    placeholder: '请选择群',
  },
);

const emit = defineEmits<{
  change: [item: ImManagerGroupApi.Group | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const attrs = useAttrs();
const dialogRef = ref<InstanceType<typeof GroupSelectDialog>>(); // 群选择弹窗
const hovering = ref(false); // 鼠标是否悬停
const selectedItem = ref<ImManagerGroupApi.Group>(); // 已选群

/** 输入框显示文本 */
const displayLabel = computed(() => selectedItem.value?.name ?? '');

/** 是否显示清除图标 */
const showClear = computed(() => {
  return (
    props.allowClear &&
    !props.disabled &&
    hovering.value &&
    props.modelValue !== null
  );
});

/** 根据编号查询群信息（用于编辑回显） */
async function resolveItemById(id: number | undefined) {
  if (isUndefined(id)) {
    selectedItem.value = undefined;
    return;
  }
  if (selectedItem.value?.id === id) {
    return;
  }
  selectedItem.value = await getManagerGroup(id);
}

watch(() => props.modelValue, resolveItemById, { immediate: true });

/** 清空已选群 */
function clearSelected() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 打开群选择弹窗 */
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
  dialogRef.value?.open(
    isUndefined(props.modelValue) ? [] : [props.modelValue],
  );
}

/** 弹窗选中回调 */
function handleSelected(rows: ImManagerGroupApi.Group[]) {
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
          <div>群名称：{{ selectedItem.name || '-' }}</div>
          <div>群主：{{ selectedItem.ownerNickname || '-' }}</div>
          <div>成员数：{{ selectedItem.memberCount ?? '-' }}</div>
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
  <GroupSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>
