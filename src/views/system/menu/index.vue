<template>
  <div>
    <BasicTable @register="register">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate"> 新增 </a-button>
        <a-button type="info" @click="expandAll">展开全部</a-button>
        <a-button type="info" @click="collapseAll">折叠全部</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                onClick: handleEdit.bind(null, record)
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                popConfirm: {
                  title: '是否确认删除',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record)
                }
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <DeptModel @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="Menu">
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { getMenuListApi } from '@/api/system/menu'
import { columns, searchFormSchema } from './menu.data'
import { useModal } from '@/components/Modal'
import DeptModel from './MenuModel.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { handleTree } from '@/utils/tree'
import { deleteDeptApi } from '@/api/system/dept'

const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [register, { expandAll, collapseAll, getForm, reload }] = useTable({
  title: '菜单列表',
  api: getList,
  columns,
  rowKey: 'id',
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
  },
  isTreeTable: true,
  pagination: false,
  striped: false,
  useSearchForm: true,
  showTableSetting: true,
  bordered: true,
  showIndexColumn: false,
  canResize: false,
  actionColumn: {
    width: 120,
    title: '操作',
    dataIndex: 'action',
    fixed: 'right'
  }
})
async function getList() {
  const res = await getMenuListApi(getForm().getFieldsValue() as any)
  return handleTree(res, 'id')
}

function handleCreate() {
  openModal(true, {
    isUpdate: false
  })
}

function handleEdit(record: Recordable) {
  openModal(true, {
    record,
    isUpdate: true
  })
}

async function handleDelete(record: Recordable) {
  console.log(record)
  const res = await deleteDeptApi(record.id)
  if (res) {
    createMessage.success('删除成功')
    reload()
  }
}
</script>
