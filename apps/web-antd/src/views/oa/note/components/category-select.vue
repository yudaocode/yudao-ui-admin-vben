<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { OaNoteCategoryApi } from '#/api/oa/note/category';

import { onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getSimpleNoteCategoryList } from '#/api/oa/note/category';

defineOptions({ name: 'OaNoteCategorySelect' });

const props = withDefaults(
  defineProps<{
    categories?: OaNoteCategoryApi.NoteCategory[];
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    categories: undefined,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择分类',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const categoryList = ref<OaNoteCategoryApi.NoteCategory[]>([]); // 分类列表
const loading = ref(false); // 分类加载中

/** 选中变化 */
function handleChange(value: SelectValue) {
  emit('update:modelValue', typeof value === 'number' ? value : undefined);
}

/** 查询分类列表 */
async function getCategoryList() {
  // 已有分类列表时直接复用，避免重复请求
  if (props.categories !== undefined) {
    return;
  }
  loading.value = true;
  try {
    categoryList.value = await getSimpleNoteCategoryList();
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getCategoryList();
});
</script>

<template>
  <Select
    :value="modelValue"
    :disabled="disabled"
    :loading="loading"
    :options="
      (categories ?? categoryList).map((category) => ({
        label: category.name,
        value: category.id,
      }))
    "
    :placeholder="placeholder"
    allow-clear
    option-filter-prop="label"
    show-search
    @change="handleChange"
  />
</template>
