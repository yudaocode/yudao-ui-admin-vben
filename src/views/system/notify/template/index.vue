<script lang="ts" setup>
import TemplateModal from './TemplateModal.vue'
import { columns, searchFormSchema } from './template.data'
import SendNotifyModal from './SendNotifyModal.vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteNotifyTemplate, getNotifyTemplatePage } from '@/api/system/notify/template'

defineOptions({ name: 'SystemMessageTemplate' })

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const [registerSendModal, { openModal: openSendModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '站内信模板列表',
  api: getNotifyTemplatePage,
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

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

function handleSend(record: Recordable) {
  openSendModal(true, record)
}

async function handleDelete(record: Recordable) {
  await deleteNotifyTemplate(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['system:notify-template:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.UPLOAD,
                label: t('action.send'),
                auth: 'system:notify-template:update',
                onClick: handleSend.bind(null, record),
              },
              {
                icon: IconEnum.EDIT,
                label: t('action.edit'),
                auth: 'system:notify-template:update',
                onClick: handleEdit.bind(null, record),
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'system:notify-template:delete',
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
    <TemplateModal @register="registerModal" @success="reload()" />
    <SendNotifyModal @register="registerSendModal" />
  </div>
</template>
