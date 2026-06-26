<script lang="ts" setup>
import type { WmsItemCategoryApi } from '#/api/wms/md/item/category';

import { onMounted, ref, watch } from 'vue';

import { Search } from '@vben/icons';
import { handleTree } from '@vben/utils';

import { ElInput, ElTree } from 'element-plus';

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
const categoryList = ref<WmsItemCategoryApi.ItemCategory[]>([]);
const categoryTree = ref<WmsItemCategoryApi.ItemCategory[]>([]);
const treeRef = ref<InstanceType<typeof ElTree>>();

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
function handleNodeClick(row: WmsItemCategoryApi.ItemCategory) {
  if (currentNodeId.value === row.id) {
    currentNodeId.value = undefined;
    treeRef.value?.setCurrentKey(undefined);
    emit('nodeClick', undefined);
    return;
  }
  currentNodeId.value = row.id;
  emit('nodeClick', row.id);
}

/** 清空选中状态 */
function reset() {
  currentNodeId.value = undefined;
  filterText.value = '';
  treeRef.value?.setCurrentKey(undefined);
  categoryTree.value = handleTree(categoryList.value, 'id', 'parentId');
}

/** 设置当前选中分类 */
function setCurrent(categoryId: number) {
  currentNodeId.value = categoryId;
  treeRef.value?.setCurrentKey(categoryId);
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
    <ElInput
      v-model="filterText"
      :placeholder="filterPlaceholder"
      class="w-full"
      clearable
    >
      <template #prefix>
        <Search class="size-4" />
      </template>
    </ElInput>
    <div v-loading="loading">
      <ElTree
        v-if="categoryTree.length > 0"
        ref="treeRef"
        :data="categoryTree"
        :expand-on-click-node="false"
        :props="{ label: 'name', children: 'children' }"
        class="pt-2"
        default-expand-all
        highlight-current
        node-key="id"
        @node-click="handleNodeClick"
      />
      <div v-else-if="!loading" class="py-4 text-center text-gray-500">
        暂无数据
      </div>
    </div>
  </div>
</template>
