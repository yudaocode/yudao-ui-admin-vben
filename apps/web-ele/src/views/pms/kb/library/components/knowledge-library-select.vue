<script lang="ts" setup>
import type { PmsKnowledgeLibraryApi } from '#/api/pms/kb/library';

import { onMounted, ref } from 'vue';

import { getAllPageItems } from '@vben/utils';

import { ElOption, ElSelect } from 'element-plus';

import { getKnowledgeLibraryPage } from '#/api/pms/kb/library';

defineOptions({ name: 'PmsKnowledgeLibrarySelect' });

withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    filterable?: boolean;
    modelValue?: number | number[];
    multiple?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: undefined,
    multiple: false,
    disabled: false,
    clearable: true,
    filterable: true,
    placeholder: '请选择知识库',
  },
);

const emit = defineEmits<{
  change: [value: number | number[] | undefined];
  'update:modelValue': [value: number | number[] | undefined];
}>(); // 定义 modelValue 更新和 change 事件

const loading = ref(false); // 知识库列表加载中
const libraryList = ref<PmsKnowledgeLibraryApi.KnowledgeLibrary[]>([]); // 可访问的知识库列表

/** 处理选中值变化 */
function handleChange(value: number | number[] | undefined) {
  emit('update:modelValue', value);
  emit('change', value);
}

/** 查询可访问的知识库列表 */
async function getLibraryList() {
  loading.value = true;
  try {
    libraryList.value =
      await getAllPageItems<PmsKnowledgeLibraryApi.KnowledgeLibrary>(
        (pageNo, pageSize) => getKnowledgeLibraryPage({ pageNo, pageSize }),
      );
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getLibraryList();
});
</script>

<template>
  <ElSelect
    :clearable="clearable"
    :disabled="disabled"
    :filterable="filterable"
    :loading="loading"
    :model-value="modelValue"
    :multiple="multiple"
    :placeholder="placeholder"
    class="w-full"
    collapse-tags
    collapse-tags-tooltip
    @update:model-value="handleChange"
  >
    <ElOption
      v-for="library in libraryList"
      :key="library.id"
      :label="library.name"
      :value="library.id"
    />
  </ElSelect>
</template>
