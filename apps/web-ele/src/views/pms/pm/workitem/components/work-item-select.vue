<script lang="ts" setup>
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { ref, watch } from 'vue';

import { getAllPageItems } from '@vben/utils';

import { ElOption, ElSelect } from 'element-plus';

import { getWorkItemPage } from '#/api/pms/pm/workitem';

defineOptions({ name: 'PmsWorkItemSelect' });

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
  <ElSelect
    :model-value="modelValue"
    :loading="loading"
    :placeholder="placeholder"
    class="w-full"
    clearable
    filterable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElOption
      v-for="workItem in workItemList"
      :key="workItem.id"
      :label="`#${workItem.serialNumber} ${workItem.name}`"
      :value="workItem.id!"
    />
  </ElSelect>
</template>
