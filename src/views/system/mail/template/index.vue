<script lang="ts" setup>
import TemplateModal from './TemplateModal.vue'
import SendMailModal from './SendMailModal.vue'
import { columns, searchFormSchema } from './template.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteMailTemplate, getMailTemplatePage } from '@/api/system/mail/template'

defineOptions({ name: 'SystemMailTemplate' })

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerTemplateModal, { openModal }] = useModal()
const [registerSendModal, { openModal: openSendModal }] = useModal()
const [registerTable, { reload }] = useTable({
  title: '邮件模板列表',
  api: getMailTemplatePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 200,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

function handleCreate() {
  openModal(true, { isUpdate: false })
}

function handleSend(record: Recordable) {
  openSendModal(true, record)
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

async function handleDelete(record: Recordable) {
  await deleteMailTemplate(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['system:mail-template:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.SEND,
                label: t('action.send'),
                auth: 'system:mail-template:send-mail',
                onClick: handleSend.bind(null, record),
              },
              {
                icon: IconEnum.EDIT,
                label: t('action.edit'),
                auth: 'system:mail-template:update',
                onClick: handleEdit.bind(null, record),
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'system:mail-template:delete',
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
    <TemplateModal @register="registerTemplateModal" @success="reload()" />
    <SendMailModal @register="registerSendModal" />
  </div>
</template>
