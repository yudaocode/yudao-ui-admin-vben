<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, Tag } from 'ant-design-vue';

import { getUser } from '#/api/system/user';
import UserSelectDialog from '#/views/system/user/components/select-dialog.vue';

defineOptions({ name: 'ImManagerUserMultiSelect' });

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    modelValue?: number[]
    placeholder?: string
  }>(),
  {
    disabled: false,
    modelValue: () => [],
    placeholder: '请选择用户',
  },
);

const emit = defineEmits<{
  change: [rows: SystemUserApi.User[]];
  'update:modelValue': [value: number[]];
}>();

const dialogRef = ref<InstanceType<typeof UserSelectDialog>>();
const selectedRows = ref<SystemUserApi.User[]>([]);

const displayText = computed(() => {
  if (selectedRows.value.length === 0) {
    return '';
  }
  return selectedRows.value
    .map((item) => item.nickname || item.username || item.id)
    .join('，');
});

/** 回显已选用户 */
async function resolveSelectedUsers(ids: number[]) {
  const knownMap = new Map(selectedRows.value.map((item) => [item.id, item]));
  const list: SystemUserApi.User[] = [];
  for (const id of ids) {
    const cached = knownMap.get(id);
    if (cached) {
      list.push(cached);
      continue;
    }
    list.push(await getUser(id));
  }
  selectedRows.value = list;
}

watch(
  () => props.modelValue,
  (ids) => {
    void resolveSelectedUsers(ids || []);
  },
  { immediate: true },
);

/** 打开用户选择弹窗 */
function handleClick() {
  if (props.disabled) {
    return;
  }
  dialogRef.value?.open(props.modelValue || [], { multiple: true });
}

/** 弹窗选中回调 */
function handleSelected(rows: SystemUserApi.User[]) {
  selectedRows.value = rows;
  emit(
    'update:modelValue',
    rows.map((item) => item.id!),
  );
  emit('change', rows);
}
</script>

<template>
  <div class="w-full">
    <Input
      :disabled="disabled"
      :placeholder="placeholder"
      :value="displayText"
      readonly
      @click="handleClick"
    >
      <template #suffix>
        <IconifyIcon class="size-4" icon="lucide:search" />
      </template>
    </Input>
    <div v-if="selectedRows.length > 0" class="mt-2 flex flex-wrap gap-1">
      <Tag v-for="item in selectedRows" :key="item.id">
        {{ item.nickname || item.username || item.id }}
      </Tag>
    </div>
    <UserSelectDialog ref="dialogRef" @selected="handleSelected" />
  </div>
</template>
