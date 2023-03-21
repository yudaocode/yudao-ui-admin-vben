<template>
  <div class="flex">
    <DeptTree class="w-1/4 xl:w-1/5" @select="handleSelect" />
    <BasicTable @register="registerTable" class="w-3/4 xl:w-4/5" :searchInfo="searchInfo">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate">新增账号</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑用户资料',
                onClick: handleEdit.bind(null, record)
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除此账号',
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
    <UserModel @register="registerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts" setup name="User">
import { reactive } from 'vue'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { useModal } from '@/components/Modal'
import UserModel from './UserModel.vue'
import DeptTree from './DeptTree.vue'
import { columns, searchFormSchema } from './user.data'
import { deleteUserApi, getUserPageApi } from '@/api/system/user'
import { useMessage } from '@/hooks/web/useMessage'

const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const searchInfo = reactive<Recordable>({})

const [registerTable, { reload, updateTableDataRecord }] = useTable({
  title: '账号列表',
  api: getUserPageApi,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema,
    autoSubmitOnEnter: true
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 120,
    title: '操作',
    dataIndex: 'action',
    fixed: 'right'
  }
})

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
  createConfirm({
    title: '删除',
    iconType: 'warning',
    content: '是否要删除数据？',
    async onOk() {
      await deleteUserApi(record.id)
      createMessage.success('删除成功')
      reload()
    }
  })
}

function handleSuccess({ isUpdate, values }) {
  if (isUpdate) {
    // 演示不刷新表格直接更新内部数据。
    // 注意：updateTableDataRecord要求表格的rowKey属性为string并且存在于每一行的record的keys中
    const result = updateTableDataRecord(values.id, values)
    console.log(result)
  } else {
    reload()
  }
}

function handleSelect(deptId = '') {
  searchInfo.deptId = deptId
  reload()
}
</script>
