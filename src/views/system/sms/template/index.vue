<script lang="ts" setup>
import SmsTemplateModal from './SmsTemplateModal.vue'
import SendSmsModal from './SendSmsModal.vue'
import { columns, searchFormSchema } from './smsTemplate.data'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import type { SmsTemplateExportReqVO } from '@/api/system/sms/smsTemplate'
import { deleteSmsTemplate, exportSmsTemplate, getSmsTemplatePage } from '@/api/system/sms/smsTemplate'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'SystemSmsTemplate' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const [registerSendModal, { openModal: openSendModal }] = useModal()
const [registerTable, { getForm, reload }] = useTable({
  title: '短信模版列表',
  api: getSmsTemplatePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 220,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

function handleCreate() {
  openModal(true, { isUpdate: false })
}

function handleSendSms(record: Recordable) {
  openSendModal(true, record)
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
      await exportSmsTemplate(getForm().getFieldsValue() as SmsTemplateExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    },
  })
}

async function handleDelete(record: Recordable) {
  await deleteSmsTemplate(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['system:sms-template:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <a-button v-auth="['system:sms-template:export']" type="warning" :pre-icon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.TEST,
                label: t('action.test'),
                auth: 'system:sms-template:send-sms',
                onClick: handleSendSms.bind(null, record),
              },
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'system:sms-template:update', onClick: handleEdit.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'system:sms-template:delete',
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
    <SmsTemplateModal @register="registerModal" @success="reload()" />
    <SendSmsModal @register="registerSendModal" />
  </div>
</template>
