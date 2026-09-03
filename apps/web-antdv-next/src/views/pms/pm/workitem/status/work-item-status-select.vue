<script lang="ts" setup>
import type { PmsWorkItemStatusApi } from '#/api/pms/pm/workitem/status';

import { ref, watch } from 'vue';

import { Select } from 'antdv-next';

import { getWorkItemStatusList } from '#/api/pms/pm/workitem/status';

defineOptions({ name: 'PmsWorkItemStatusSelect' });

// TODO @AI：对齐 system/user/components/select.vue：modelValue、禁用、清空、回显；三端 props 和清空行为保持一致。

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    placeholder?: string;
    projectId: number;
    workItemType: number;
  }>(),
  { modelValue: undefined, placeholder: '请选择状态' },
);

const emit = defineEmits(['update:modelValue', 'change']);

const loading = ref(false); // 选项加载中
const statusList = ref<PmsWorkItemStatusApi.WorkItemStatus[]>([]); // 工作项状态选项

/** 查询工作项状态选项 */
async function getStatusList() {
  loading.value = true;
  try {
    statusList.value = await getWorkItemStatusList(
      props.projectId,
      props.workItemType,
    );
  } finally {
    loading.value = false;
  }
}

watch(() => [props.projectId, props.workItemType], getStatusList, {
  immediate: true,
});
</script>

<template>
  <Select
    :loading="loading"
    :options="
      statusList.map((status) => ({ label: status.name, value: status.id }))
    "
    :placeholder="placeholder"
    :value="modelValue"
    class="w-full"
    @change="emit('change', $event)"
    @update:value="emit('update:modelValue', $event)"
  />
</template>
