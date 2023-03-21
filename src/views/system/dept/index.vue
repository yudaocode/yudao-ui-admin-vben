<template>
  <div>
    <BasicTable @register="register" @fetch-success="onFetchSuccess">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate"> 新增 </a-button>
        <a-button type="info" @click="expandAll">展开全部</a-button>
        <a-button type="info" @click="collapseAll">折叠全部</a-button>
      </template>
      <template #leader="{ text }">
        <span> {{ userNicknameFormat(text) }} </span>
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
<script lang="ts" setup name="Dept">
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { deleteDeptApi, getDeptPageApi } from '@/api/system/dept'
import { columns, searchFormSchema } from './dept.data'
import { useModal } from '@/components/Modal'
import DeptModel from './DeptModel.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { handleTree } from '@/utils/tree'
import { nextTick, ref } from 'vue'
import { getListSimpleUsersApi } from '@/api/system/user'
import { onMounted } from 'vue'

const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [register, { expandAll, collapseAll, getForm, reload }] = useTable({
  title: '部门列表',
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
  const res = await getDeptPageApi(getForm().getFieldsValue() as any)
  return handleTree(res, 'id')
}

const users = ref<any[]>([])

async function getUserList() {
  const res = await getListSimpleUsersApi()
  users.value = res
}

function userNicknameFormat(row) {
  console.info(row)
  if (!row.leaderUserId) {
    return '未设置'
  }
  for (const user of users.value) {
    if (row.leaderUserId === user.id) {
      return user.nickname
    }
  }
  return '未知【' + row.leaderUserId + '】'
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
  createConfirm({
    title: '删除',
    iconType: 'warning',
    content: '是否要删除数据？',
    async onOk() {
      await deleteDeptApi(record.id)
      createMessage.success('删除成功')
      reload()
    }
  })
}

function onFetchSuccess() {
  // 演示默认展开所有表项
  nextTick(expandAll)
}

onMounted(async () => {
  await getUserList()
})
</script>
