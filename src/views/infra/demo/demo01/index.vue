<script lang="ts" setup>
import Demo01ContactModal from './Demo01ContactModal.vue'
import { columns, searchFormSchema } from './demo01Contact.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteDemo01Contact, exportDemo01Contact, getDemo01ContactPage } from '@/api/infra/demo/demo01'
import { IconEnum } from '@/enums/appEnum'

defineOptions({ name: 'Demo01Contact' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { getForm, reload }] = useTable({
  title: '示例联系人列表',
  api: getDemo01ContactPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
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
  openModal(true, { isUpdate: false })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportDemo01Contact(getForm().getFieldsValue())
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}

async function handleDelete(record: Recordable) {
  await deleteDemo01Contact(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" v-auth="['infra:demo01-contact:create']" :preIcon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <a-button v-auth="['infra:demo01-contact:export']" :preIcon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'infra:demo01-contact:update', onClick: handleEdit.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                danger: true,
                label: t('action.delete'),
                auth: 'infra:demo01-contact:delete',
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
    <Demo01ContactModal @register="registerModal" @success="reload()" />
  </div>
</template>
