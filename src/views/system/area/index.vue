<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" :preIcon="IconEnum.ADD" @click="handleCreate"> IP 查询 </a-button>
      </template>
    </BasicTable>
    <AreaModal @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="SystemArea">
import { useModal } from '@/components/Modal'
import AreaModal from './AreaModal.vue'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable } from '@/components/Table'
import { getAreaTree } from '@/api/system/area'
import { columns } from './area.data'
import { handleTree } from '@/utils/tree'

const [registerModal, { openModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '岗位列表',
  api: getList,
  columns,
  rowKey: 'id',
  isTreeTable: true,
  pagination: false,
  striped: false,
  useSearchForm: false,
  showTableSetting: true,
  bordered: true,
  showIndexColumn: false,
  canResize: false
})

async function getList() {
  const res = await getAreaTree()
  return handleTree(res, 'id')
}

function handleCreate() {
  openModal(true, { isUpdate: false })
}
</script>
