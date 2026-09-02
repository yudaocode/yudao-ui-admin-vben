<script lang="ts" setup>
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getProjectPage } from '#/api/pms/pm/project';
import { getAllPageItems } from '#/views/pms/utils/page';

defineOptions({ name: 'PmsProjectSelect' });

withDefaults(defineProps<{ modelValue?: number }>(), {
  modelValue: undefined,
});

const emit = defineEmits<{
  change: [value?: number];
  'update:modelValue': [value?: number];
}>();

const projectList = ref<PmsProjectApi.Project[]>([]); // 当前用户可访问的项目列表

/** 切换项目 */
function handleChange(value?: number) {
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
  <ElSelect
    :model-value="modelValue"
    class="w-full"
    clearable
    filterable
    placeholder="项目筛选"
    @change="handleChange"
  >
    <ElOption
      v-for="project in projectList"
      :key="project.id"
      :label="project.name"
      :value="project.id"
    />
  </ElSelect>
</template>
