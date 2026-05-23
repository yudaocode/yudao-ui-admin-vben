<script lang="ts" setup>
import type { MesMdItemTypeApi } from '#/api/mes/md/item/type';

import { onMounted, ref, watch } from 'vue';

import { Search } from '@vben/icons';
import { handleTree } from '@vben/utils';

import { ElInput, ElTree } from 'element-plus';

import { getItemTypeSimpleList } from '#/api/mes/md/item/type';

defineOptions({ name: 'MdItemTypeTree' });

withDefaults(
  defineProps<{
    filterPlaceholder?: string;
  }>(),
  {
    filterPlaceholder: '搜索分类',
  },
);

const emit = defineEmits<{
  nodeClick: [itemType: MesMdItemTypeApi.ItemType | undefined];
}>();

const loading = ref(false); // 分类树加载中
const filterText = ref(''); // 分类搜索关键字
const currentNodeId = ref<number>(); // 当前选中分类编号
const itemTypeList = ref<MesMdItemTypeApi.ItemType[]>([]); // 物料分类列表
const itemTypeTree = ref<MesMdItemTypeApi.ItemType[]>([]); // 物料分类树
const treeRef = ref<InstanceType<typeof ElTree>>(); // 分类树实例

/** 加载分类树 */
async function loadTree() {
  loading.value = true;
  try {
    const data = await getItemTypeSimpleList();
    itemTypeList.value = data;
    itemTypeTree.value = handleTree(data, 'id', 'parentId');
  } finally {
    loading.value = false;
  }
}

/** 处理搜索逻辑 */
function handleSearch(value: string) {
  filterText.value = value;
  const filteredList = value
    ? itemTypeList.value.filter((item) => item.name?.includes(value))
    : itemTypeList.value;
  itemTypeTree.value = handleTree(filteredList, 'id', 'parentId');
}

/** 处理节点点击：支持点击同一节点取消选中 */
function handleNodeClick(row: MesMdItemTypeApi.ItemType) {
  if (currentNodeId.value === row.id) {
    currentNodeId.value = undefined;
    treeRef.value?.setCurrentKey(undefined);
    emit('nodeClick', undefined);
    return;
  }
  currentNodeId.value = row.id;
  emit('nodeClick', row);
}

/** 清空选中状态 */
function clearCurrent() {
  currentNodeId.value = undefined;
  treeRef.value?.setCurrentKey(undefined);
}

/** 重置整个树状态 */
function reset() {
  clearCurrent();
  filterText.value = '';
  itemTypeTree.value = handleTree(itemTypeList.value, 'id', 'parentId');
}

/** 设置当前选中分类 */
function setCurrent(itemTypeId: number) {
  currentNodeId.value = itemTypeId;
  treeRef.value?.setCurrentKey(itemTypeId);
}

watch(filterText, (value) => {
  handleSearch(value);
});

defineExpose({ clearCurrent, loadTree, reset, setCurrent });

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
        v-if="itemTypeTree.length > 0"
        ref="treeRef"
        :data="itemTypeTree"
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
