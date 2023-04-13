<template>
  <div class="m-4 mr-0 overflow-hidden bg-white">
    <BasicTree
      title="部门列表"
      toolbar
      search
      treeWrapperClassName="h-[calc(100%-35px)] overflow-auto"
      :clickRowToExpand="false"
      :treeData="treeData"
      :fieldNames="{ key: 'id', title: 'name' }"
      @select="handleSelect"
    />
  </div>
</template>
<script lang="ts" setup name="SystemDeptTree">
import { onMounted, ref } from 'vue'

import { BasicTree, TreeItem } from '@/components/Tree'
import { listSimpleDept } from '@/api/system/dept'
import { handleTree } from '@/utils/tree'

const emit = defineEmits(['select'])
const treeData = ref<TreeItem[]>([])

async function fetch() {
  const res = await listSimpleDept()
  treeData.value = handleTree(res, 'id')
}

function handleSelect(keys) {
  emit('select', keys[0])
}

onMounted(() => {
  fetch()
})
</script>
