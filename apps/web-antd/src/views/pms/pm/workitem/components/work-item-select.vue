<script lang="ts" setup>
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { ref, watch } from 'vue';

import { getAllPageItems } from '@vben/utils';

import { Select } from 'ant-design-vue';

import { getWorkItemPage } from '#/api/pms/pm/workitem';

defineOptions({ name: 'PmsWorkItemSelect' });

// TODO @AI：对齐 system/user/components/select.vue：modelValue、禁用、清空、回显；三端 props 和清空行为保持一致。

const props = withDefaults(
  defineProps<{
    excludeId?: number;
    modelValue?: number;
    placeholder?: string;
    projectId: number;
    type: number;
  }>(),
  { excludeId: undefined, modelValue: undefined, placeholder: '请选择工作项' },
);

const emit = defineEmits(['update:modelValue']);

const loading = ref(false); // 选项加载中
const workItemList = ref<PmsWorkItemApi.WorkItem[]>([]); // 工作项选项

/** 查询工作项选项 */
async function getWorkItemList() {
  loading.value = true;
  try {
    const list = await getAllPageItems<PmsWorkItemApi.WorkItem>(
      (pageNo, pageSize) =>
        getWorkItemPage({
          pageNo,
          pageSize,
          projectId: props.projectId,
          type: props.type,
        }),
    );
    workItemList.value = list.filter(
      (workItem) => workItem.id !== props.excludeId,
    );
  } finally {
    loading.value = false;
  }
}

watch(() => [props.projectId, props.type, props.excludeId], getWorkItemList, {
  immediate: true,
});
</script>

<template>
  <Select
    :allow-clear="true"
    :loading="loading"
    :options="
      workItemList
        .filter((workItem) => workItem.id !== undefined)
        .map((workItem) => ({
          label: `#${workItem.serialNumber} ${workItem.name}`,
          value: workItem.id!,
        }))
    "
    :placeholder="placeholder"
    :value="modelValue"
    class="w-full"
    option-filter-prop="label"
    show-search
    @update:value="emit('update:modelValue', $event)"
  />
</template>
