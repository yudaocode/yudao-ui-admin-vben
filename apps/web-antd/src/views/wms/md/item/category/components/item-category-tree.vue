<script lang="ts" setup>
import type { WmsItemCategoryApi } from '#/api/wms/md/item/category';

import { onMounted, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { handleTree } from '@vben/utils';

import { Input, Spin, Tree } from 'ant-design-vue';

import { getItemCategorySimpleList } from '#/api/wms/md/item/category';

/** WMS 商品分类树组件 */
defineOptions({ name: 'WmsItemCategoryTree' });

withDefaults(
  defineProps<{
    filterPlaceholder?: string;
  }>(),
  {
    filterPlaceholder: '请输入分类名称',
  },
);

const emit = defineEmits<{
  nodeClick: [categoryId: number | undefined];
}>();

const loading = ref(false);
const filterText = ref('');
const currentNodeId = ref<number>();
const selectedKeys = ref<number[]>([]);
const categoryList = ref<WmsItemCategoryApi.ItemCategory[]>([]);
const categoryTree = ref<any[]>([]);

/** 加载分类树 */
async function loadTree() {
  loading.value = true;
  try {
    const data = await getItemCategorySimpleList();
    categoryList.value = data;
    categoryTree.value = handleTree(data, 'id', 'parentId');
  } finally {
    loading.value = false;
  }
}

/** 处理搜索逻辑 */
function handleSearch(value: string) {
  filterText.value = value;
  const filteredList = value
    ? categoryList.value.filter((item) => item.name?.includes(value))
    : categoryList.value;
  categoryTree.value = handleTree(filteredList, 'id', 'parentId');
}

/** 处理节点点击：支持点击同一节点取消选中 */
function handleSelect(_selectedKeys: any[], info: any) {
  const row = info.node.dataRef as WmsItemCategoryApi.ItemCategory;
  if (currentNodeId.value === row.id) {
    currentNodeId.value = undefined;
    selectedKeys.value = [];
    emit('nodeClick', undefined);
    return;
  }
  currentNodeId.value = row.id;
  selectedKeys.value = row.id === undefined ? [] : [row.id];
  emit('nodeClick', row.id);
}

/** 清空选中状态 */
function reset() {
  currentNodeId.value = undefined;
  filterText.value = '';
  selectedKeys.value = [];
  categoryTree.value = handleTree(categoryList.value, 'id', 'parentId');
}

/** 设置当前选中分类 */
function setCurrent(categoryId: number) {
  currentNodeId.value = categoryId;
  selectedKeys.value = [categoryId];
}

watch(filterText, (value) => {
  handleSearch(value);
});

defineExpose({ reset, setCurrent });

onMounted(() => {
  loadTree();
});
</script>

<template>
  <div class="h-full">
    <Input
      v-model:value="filterText"
      :placeholder="filterPlaceholder"
      allow-clear
      class="w-full"
    >
      <template #prefix>
        <IconifyIcon class="size-4" icon="lucide:search" />
      </template>
    </Input>
    <Spin :spinning="loading" wrapper-class-name="w-full">
      <Tree
        v-if="categoryTree.length > 0"
        :default-expand-all="true"
        :field-names="{ title: 'name', key: 'id', children: 'children' }"
        :selected-keys="selectedKeys"
        :tree-data="categoryTree"
        class="pt-2"
        @select="handleSelect"
      />
      <div v-else-if="!loading" class="py-4 text-center text-gray-500">
        暂无数据
      </div>
    </Spin>
  </div>
</template>
