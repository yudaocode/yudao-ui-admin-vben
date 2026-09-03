<script lang="ts" setup>
import type { PmsKnowledgeLibraryApi } from '#/api/pms/kb/library';

import { onMounted, ref } from 'vue';

import { getAllPageItems } from '@vben/utils';

import { Select } from 'ant-design-vue';

import { getKnowledgeLibraryPage } from '#/api/pms/kb/library';

defineOptions({ name: 'PmsKnowledgeLibrarySelect' });

// TODO @AI：对齐 system/user/components/select.vue：modelValue、禁用、清空、回显；三端 props 和清空行为保持一致。

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
function handleChange(value: any) {
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
  <Select
    :allow-clear="clearable"
    :disabled="disabled"
    :loading="loading"
    :max-tag-count="multiple ? 'responsive' : undefined"
    :mode="multiple ? 'multiple' : undefined"
    :options="
      libraryList.map((library) => ({ label: library.name, value: library.id }))
    "
    :placeholder="placeholder"
    :show-search="filterable"
    :value="modelValue"
    class="w-full"
    option-filter-prop="label"
    @change="handleChange"
  />
</template>
