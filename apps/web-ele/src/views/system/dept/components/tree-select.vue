<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { onMounted, ref } from 'vue';

import { Search } from '@vben/icons';
import { handleTree } from '@vben/utils';

import { ElInput, ElTree } from 'element-plus';

import { getSimpleDeptList } from '#/api/system/dept';

defineOptions({ name: 'DeptTreeSelect' });

const emit = defineEmits<{
  select: [dept?: SystemDeptApi.Dept];
}>();

const deptList = ref<SystemDeptApi.Dept[]>([]); // 部门列表
const deptTree = ref<any[]>([]); // 部门树
const loading = ref(false); // 加载状态
const searchValue = ref(''); // 搜索值
const treeRef = ref<InstanceType<typeof ElTree>>(); // 树 Ref
let currentNodeId: number | undefined; // 当前选中的节点 ID

/** 处理搜索逻辑 */
function handleSearch(value: string) {
  searchValue.value = value;
  const filteredList = value
    ? deptList.value.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase()),
      )
    : deptList.value;
  deptTree.value = handleTree(filteredList);
}

/** 选中部门：点击已选中的节点时取消选中 */
function handleSelect(data: SystemDeptApi.Dept) {
  if (currentNodeId === data.id) {
    currentNodeId = undefined;
    treeRef.value?.setCurrentKey(undefined);
    emit('select', undefined);
    return;
  }
  currentNodeId = data.id;
  emit('select', data);
}

/** 重置选中状态（供外部重置按钮调用） */
function reset() {
  searchValue.value = '';
  currentNodeId = undefined;
  treeRef.value?.setCurrentKey(undefined);
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
    <ElInput
      v-model="searchValue"
      class="w-full"
      clearable
      placeholder="搜索部门"
      @input="handleSearch"
    >
      <template #prefix>
        <Search class="size-4" />
      </template>
    </ElInput>
    <div v-loading="loading">
      <ElTree
        v-if="deptTree.length > 0"
        ref="treeRef"
        class="pt-2"
        :data="deptTree"
        default-expand-all
        highlight-current
        node-key="id"
        :props="{ label: 'name', children: 'children' }"
        @node-click="handleSelect"
      />
      <div v-else-if="!loading" class="py-4 text-center text-gray-500">
        暂无数据
      </div>
    </div>
  </div>
</template>
