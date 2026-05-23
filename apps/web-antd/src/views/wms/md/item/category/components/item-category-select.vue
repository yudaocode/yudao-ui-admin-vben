<script lang="ts" setup>
import type { WmsItemCategoryApi } from '#/api/wms/md/item/category';

import { computed, onMounted, ref } from 'vue';

import { handleTree } from '@vben/utils';

import { TreeSelect } from 'ant-design-vue';

import { getItemCategorySimpleList } from '#/api/wms/md/item/category';

/** WMS 商品分类选择器 */
defineOptions({ name: 'WmsItemCategorySelect', inheritAttrs: false });

const props = withDefaults(
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
    placeholder: '请选择商品分类',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const categoryTree = ref<WmsItemCategoryApi.ItemCategory[]>([]);

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

/** 查询商品分类树 */
async function getCategoryTree() {
  const data = await getItemCategorySimpleList();
  categoryTree.value = handleTree(data, 'id', 'parentId');
}

onMounted(() => {
  getCategoryTree();
});
</script>

<template>
  <TreeSelect
    v-bind="$attrs"
    v-model:value="selectValue"
    :allow-clear="allowClear"
    :disabled="disabled"
    :field-names="{ children: 'children', label: 'name', value: 'id' }"
    :placeholder="placeholder"
    :tree-data="categoryTree"
    class="w-full"
    tree-default-expand-all
    tree-node-filter-prop="name"
    show-search
  />
</template>
