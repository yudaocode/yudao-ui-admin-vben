<script lang="ts" setup>
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { onMounted, ref } from 'vue';

import { getAllPageItems } from '@vben/utils';

import { Select } from 'antdv-next';

import { getProjectPage } from '#/api/pms/pm/project';

defineOptions({ name: 'PmsProjectSelect' });

// TODO @AI：对齐 system/user/components/select.vue：modelValue、禁用、清空、回显；三端 props 和清空行为保持一致。

withDefaults(defineProps<{ modelValue?: number }>(), {
  modelValue: undefined,
});

const emit = defineEmits<{
  change: [value?: number];
  'update:modelValue': [value?: number];
}>();

const projectList = ref<PmsProjectApi.Project[]>([]); // 当前用户可访问的项目列表

/** 切换项目 */
function handleChange(value: any) {
  emit('update:modelValue', value);
  emit('change', value);
}

/** 查询当前用户可访问的项目 */
async function getProjectList() {
  projectList.value = await getAllPageItems<PmsProjectApi.Project>(
    (pageNo, pageSize) => getProjectPage({ pageNo, pageSize }),
  );
}

/** 初始化 */
onMounted(() => {
  getProjectList();
});
</script>

<template>
  <Select
    :allow-clear="true"
    :options="
      projectList.map((project) => ({ label: project.name, value: project.id }))
    "
    :value="modelValue"
    class="w-full"
    option-filter-prop="label"
    placeholder="项目筛选"
    show-search
    @change="handleChange"
  />
</template>
