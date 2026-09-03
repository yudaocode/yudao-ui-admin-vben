<script lang="ts" setup>
import type { PmsIterationApi } from '#/api/pms/pm/iteration';

import { ref, watch } from 'vue';

import { getAllPageItems } from '@vben/utils';

import { ElOption, ElSelect } from 'element-plus';

import { getIterationPage } from '#/api/pms/pm/iteration';

defineOptions({ name: 'PmsIterationSelect' });

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[];
    multiple?: boolean;
    placeholder?: string;
    projectId?: number;
  }>(),
  {
    modelValue: undefined,
    multiple: false,
    placeholder: '请选择迭代',
    projectId: undefined,
  },
);

const emit = defineEmits(['update:modelValue']);

const loading = ref(false); // 选项加载中
const iterationList = ref<PmsIterationApi.Iteration[]>([]); // 迭代选项

/** 查询项目迭代选项 */
async function getIterationList(projectId: number) {
  loading.value = true;
  try {
    iterationList.value = await getAllPageItems<PmsIterationApi.Iteration>(
      (pageNo, pageSize) => getIterationPage({ pageNo, pageSize, projectId }),
    );
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.projectId,
  async (projectId) => {
    // 未选择项目时不查询，避免后端「项目编号不能为空」报错
    if (!projectId) {
      iterationList.value = [];
      return;
    }
    await getIterationList(projectId);
  },
  { immediate: true },
);
</script>

<template>
  <ElSelect
    :model-value="modelValue"
    :collapse-tags="multiple"
    :loading="loading"
    :multiple="multiple"
    :placeholder="placeholder"
    class="w-full"
    clearable
    collapse-tags-tooltip
    filterable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElOption
      v-for="iteration in iterationList"
      :key="iteration.id"
      :label="iteration.name"
      :value="iteration.id!"
    />
  </ElSelect>
</template>
