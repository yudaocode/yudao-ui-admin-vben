<script lang="ts" setup>
import type { MesMdItemTypeApi } from '#/api/mes/md/item/type';

import { onMounted, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { handleTree } from '@vben/utils';

import { Input, Spin, Tree } from 'ant-design-vue';

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
const selectedKeys = ref<number[]>([]); // 当前选中节点 key 列表
const itemTypeList = ref<MesMdItemTypeApi.ItemType[]>([]); // 物料分类列表
const itemTypeTree = ref<any[]>([]); // 物料分类树

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
function handleSelect(_selectedKeys: any[], info: any) {
  const row = info.node.dataRef as MesMdItemTypeApi.ItemType;
  if (currentNodeId.value === row.id) {
    currentNodeId.value = undefined;
    selectedKeys.value = [];
    emit('nodeClick', undefined);
    return;
  }
  currentNodeId.value = row.id;
  selectedKeys.value = row.id === undefined ? [] : [row.id];
  emit('nodeClick', row);
}

/** 清空选中状态 */
function clearCurrent() {
  currentNodeId.value = undefined;
  selectedKeys.value = [];
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
  selectedKeys.value = [itemTypeId];
}

watch(filterText, (value) => {
  handleSearch(value);
});

defineExpose({ clearCurrent, loadTree, reset, setCurrent });

/** 初始化 */
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
        v-if="itemTypeTree.length > 0"
        :default-expand-all="true"
        :field-names="{ title: 'name', key: 'id', children: 'children' }"
        :selected-keys="selectedKeys"
        :tree-data="itemTypeTree"
        class="pt-2"
        @select="handleSelect"
      />
      <div v-else-if="!loading" class="py-4 text-center text-gray-500">
        暂无数据
      </div>
    </Spin>
  </div>
</template>
