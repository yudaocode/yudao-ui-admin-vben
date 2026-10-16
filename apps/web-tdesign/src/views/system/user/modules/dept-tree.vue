<script lang="ts" setup>
import type { InputValue, TreeNodeModel } from 'tdesign-vue-next';

import type { SystemDeptApi } from '#/api/system/dept';

import { onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { handleTree } from '@vben/utils';

import { Input, Tree } from 'tdesign-vue-next';

import { getSimpleDeptList } from '#/api/system/dept';

const emit = defineEmits(['select']);
const deptList = ref<SystemDeptApi.Dept[]>([]); // 部门列表
const deptTree = ref<any[]>([]); // 部门树
const expandedKeys = ref<number[]>([]); // 展开的节点
const loading = ref(false); // 加载状态
const searchValue = ref(''); // 搜索值

/** 处理搜索逻辑 */
function handleSearch(inputValue: InputValue) {
  const value = String(inputValue);
  searchValue.value = value;
  const filteredList = value
    ? deptList.value.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase()),
      )
    : deptList.value;
  deptTree.value = handleTree(filteredList);
  // 展开所有节点
  expandedKeys.value = deptTree.value.map((node) => node.id!);
}

/** 选中部门 */
function handleSelect({ node }: { node: TreeNodeModel }) {
  emit('select', node.data);
}

/** 初始化 */
onMounted(async () => {
  try {
    loading.value = true;
    const data = await getSimpleDeptList();
    deptList.value = data;
    deptTree.value = handleTree(data);
  } catch (error) {
    console.error('获取部门数据失败', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <Input
      placeholder="搜索部门"
      clearable
      v-model="searchValue"
      @change="handleSearch"
      class="w-full"
    >
      <template #prefix-icon>
        <IconifyIcon icon="lucide:search" class="size-4" />
      </template>
    </Input>
    <div v-loading="loading" class="w-full">
      <Tree
        @click="handleSelect"
        v-if="deptTree.length > 0"
        class="pt-2"
        :data="deptTree"
        expand-all
        activable
        :keys="{ label: 'name', value: 'id', children: 'children' }"
      />
      <div v-else-if="!loading" class="py-4 text-center text-gray-500">
        暂无数据
      </div>
    </div>
  </div>
</template>
