<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate"> 新增 </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                label: '修改',
                onClick: handleEdit.bind(null, record)
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                label: '删除',
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
    <ClientModel @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="Client">
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { deleteOAuth2ClientApi, getOAuth2ClientPageApi } from '@/api/system/oauth2/client'
import { useModal } from '@/components/Modal'
import ClientModel from './ClientModel.vue'
import { columns, searchFormSchema } from './client.data'
import { useMessage } from '@/hooks/web/useMessage'

const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const [registerTable, { reload }] = useTable({
  title: '应用列表',
  api: getOAuth2ClientPageApi,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 160,
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
  await deleteOAuth2ClientApi(record.id)
  createMessage.success('删除成功')
  reload()
}
</script>
