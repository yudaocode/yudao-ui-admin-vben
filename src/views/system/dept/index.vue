<template>
  <div>
    <BasicTable @register="register" @fetch-success="onFetchSuccess">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate"> {{ t('action.create') }} </a-button>
        <a-button type="info" @click="expandAll">{{ t('component.tree.expandAll') }}</a-button>
        <a-button type="info" @click="collapseAll">{{ t('component.tree.unExpandAll') }}</a-button>
      </template>
      <template #leader="{ text }">
        <span> {{ userNicknameFormat(text) }} </span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: 'clarity:note-edit-line', label: t('action.edit'), onClick: handleEdit.bind(null, record) },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                label: t('action.delete'),
                popConfirm: {
                  title: t('common.delMessage'),
                  placement: 'left',
                  confirm: handleDelete.bind(null, record)
                }
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <DeptModal @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="Dept">
import { nextTick, ref, onMounted } from 'vue'
import { handleTree } from '@/utils/tree'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import DeptModal from './DeptModal.vue'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { getListSimpleUsersApi } from '@/api/system/user'
import { deleteDeptApi, getDeptPageApi } from '@/api/system/dept'
import { columns, searchFormSchema } from './dept.data'

const { t } = useI18n()
const { createMessage } = useMessage()
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
    title: t('common.action'),
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
  await deleteDeptApi(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}

function onFetchSuccess() {
  nextTick(expandAll)
}

onMounted(async () => {
  await getUserList()
})
</script>
