<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { handleTree } from '@vben/utils';

import { Input, Spin, Tree } from 'ant-design-vue';

import { getSimpleDeptList } from '#/api/system/dept';

defineOptions({ name: 'DeptTreeSelect' });

const emit = defineEmits<{
  select: [dept?: SystemDeptApi.Dept];
}>();

const deptList = ref<SystemDeptApi.Dept[]>([]); // 部门列表
const deptTree = ref<any[]>([]); // 部门树
const expandedKeys = ref<number[]>([]); // 展开的节点
const selectedKeys = ref<number[]>([]); // 选中的节点
const loading = ref(false); // 加载状态
const searchValue = ref(''); // 搜索值

/** 处理搜索逻辑 */
function handleSearch(e: any) {
  const value = e.target.value;
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

/** 选中部门：点击已选中的节点时取消选中 */
function handleSelect(_selectedKeys: any[], info: any) {
  emit('select', info.selected ? info.node.dataRef : undefined);
}

/** 重置选中状态（供外部重置按钮调用） */
function reset() {
  searchValue.value = '';
  selectedKeys.value = [];
  deptTree.value = handleTree(deptList.value);
  emit('select', undefined);
}

defineExpose({ reset });

/** 初始化 */
onMounted(async () => {
  try {
    loading.value = true;
    const data = await getSimpleDeptList();
    deptList.value = data;
    deptTree.value = handleTree(data);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <Input
      v-model:value="searchValue"
      allow-clear
      class="w-full"
      placeholder="搜索部门"
      @change="handleSearch"
    >
      <template #prefix>
        <IconifyIcon class="size-4" icon="lucide:search" />
      </template>
    </Input>
    <Spin :spinning="loading" wrapper-class-name="w-full">
      <Tree
        v-if="deptTree.length > 0"
        v-model:selected-keys="selectedKeys"
        class="pt-2"
        :default-expand-all="true"
        :field-names="{ title: 'name', key: 'id', children: 'children' }"
        :tree-data="deptTree"
        @select="handleSelect"
      />
      <div v-else-if="!loading" class="py-4 text-center text-gray-500">
        暂无数据
      </div>
    </Spin>
  </div>
</template>
