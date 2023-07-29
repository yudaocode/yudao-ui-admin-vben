<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue'
import DeptModal from './DeptModal.vue'
import { columns, searchFormSchema } from './dept.data'
import { handleTree } from '@/utils/tree'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getListSimpleUsers } from '@/api/system/user'
import { deleteDept, getDeptPage } from '@/api/system/dept'

defineOptions({ name: 'SystemDept' })

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [register, { expandAll, collapseAll, getForm, reload }] = useTable({
  title: '部门列表',
  api: getList,
  columns,
  rowKey: 'id',
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  isTreeTable: true,
  pagination: false,
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

async function getList() {
  const res = await getDeptPage(getForm().getFieldsValue() as any)
  return handleTree(res, 'id')
}

const users = ref<any[]>([])

async function getUserList() {
  const res = await getListSimpleUsers()
  users.value = res
}

function handleCreate() {
  openModal(true, { isUpdate: false })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

async function handleDelete(record: Recordable) {
  await deleteDept(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}

function onFetchSuccess() {
  nextTick(expandAll)
}

function userNicknameFormat(row) {
  if (!row.leaderUserId)
    return '未设置'

  for (const user of users.value) {
    if (row.leaderUserId === user.id)
      return user.nickname
  }
  return `未知【${row.leaderUserId}】`
}

onMounted(async () => {
  await getUserList()
})
</script>

<template>
  <div>
    <BasicTable @register="register" @fetch-success="onFetchSuccess">
      <template #toolbar>
        <a-button v-auth="['system:dept:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <a-button type="info" @click="expandAll">
          {{ t('component.tree.expandAll') }}
        </a-button>
        <a-button type="info" @click="collapseAll">
          {{ t('component.tree.unExpandAll') }}
        </a-button>
      </template>
      <template #leader="{ text }">
        <span> {{ userNicknameFormat(text) }} </span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'system:dept:update', onClick: handleEdit.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'system:dept:delete',
                popConfirm: {
                  title: t('common.delMessage'),
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <DeptModal @register="registerModal" @success="reload()" />
  </div>
</template>
