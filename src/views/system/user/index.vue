<template>
  <div class="flex">
    <DeptTree class="w-1/4 xl:w-1/5" @select="handleSelect" />
    <BasicTable @register="registerTable" class="w-3/4 xl:w-4/5" :searchInfo="searchInfo">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate"> {{ t('action.create') }} </a-button>
        <a-button type="warning" @click="handleExport"> {{ t('action.export') }} </a-button>
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
    <UserModal @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="User">
import { reactive } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import UserModal from './UserModal.vue'
import DeptTree from './DeptTree.vue'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { columns, searchFormSchema } from './user.data'
import { UserExportReqVO, deleteUserApi, exportUserApi, getUserPageApi } from '@/api/system/user'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const searchInfo = reactive<Recordable>({})

const [registerTable, { getForm, reload }] = useTable({
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
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})

function handleCreate() {
  openModal(true, {
    isUpdate: false
  })
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportUserApi(getForm().getFieldsValue() as UserExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}

function handleEdit(record: Recordable) {
  openModal(true, {
    record,
    isUpdate: true
  })
}

async function handleDelete(record: Recordable) {
  await deleteUserApi(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}

function handleSelect(deptId = '') {
  searchInfo.deptId = deptId
  reload()
}
</script>
