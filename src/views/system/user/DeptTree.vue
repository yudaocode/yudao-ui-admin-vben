<script lang="ts" setup>
import { onMounted, ref } from 'vue'

import type { TreeItem } from '@/components/Tree'
import { BasicTree } from '@/components/Tree'
import { listSimpleDept } from '@/api/system/dept'
import { handleTree } from '@/utils/tree'

defineOptions({ name: 'SystemDeptTree' })

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

<template>
  <div class="m-4 mr-0 overflow-hidden">
    <BasicTree
      title="部门列表"
      toolbar
      search
      tree-wrapper-class-name="h-[calc(100%-35px)] overflow-auto"
      :click-row-to-expand="false"
      :tree-data="treeData"
      :field-names="{ key: 'id', title: 'name' }"
      @select="handleSelect"
    />
  </div>
</template>
