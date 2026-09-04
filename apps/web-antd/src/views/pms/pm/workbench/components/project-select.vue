<script lang="ts" setup>
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { onMounted, ref } from 'vue';

import { getAllPageItems } from '@vben/utils';

import { Select } from 'ant-design-vue';

import { getProjectPage } from '#/api/pms/pm/project';

defineOptions({ name: 'PmsProjectSelect' });

withDefaults(
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
    placeholder: '项目筛选',
  },
);

const emit = defineEmits<{
  change: [value?: number];
  'update:modelValue': [value?: number];
}>();

const projectList = ref<PmsProjectApi.Project[]>([]); // 当前用户可访问的项目列表
const loading = ref(false); // 项目选项加载中

/** 切换项目 */
function handleChange(value: any) {
  emit('update:modelValue', value);
  emit('change', value);
}

/** 查询当前用户可访问的项目 */
async function getProjectList() {
  loading.value = true;
  try {
    projectList.value = await getAllPageItems<PmsProjectApi.Project>(
      (pageNo, pageSize) => getProjectPage({ pageNo, pageSize }),
    );
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getProjectList();
});
</script>

<template>
  <Select
    :allow-clear="allowClear"
    :disabled="disabled"
    :loading="loading"
    :options="
      projectList.map((project) => ({ label: project.name, value: project.id }))
    "
    :value="modelValue"
    class="w-full"
    option-filter-prop="label"
    :placeholder="placeholder"
    show-search
    @change="handleChange"
  />
</template>
