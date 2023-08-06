<script lang="ts" setup>
import BpmFormModal from './FormModal.vue'
import { columns, searchFormSchema } from './form.data'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteForm, getFormPage } from '@/api/bpm/form'

defineOptions({ name: 'BpmForm' })

const go = useGo()
const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '流程表单列表',
  api: getFormPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  actionColumn: {
    width: 180,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

function handleCreate() {
  // openModal(true, { isUpdate: false })
}

function openForm(record: Recordable) {
  if (typeof record.id === 'number')
    go({ name: 'BpmFormEditor', query: { id: record.id } })
}

function openDetail(record: Recordable) {
  openModal(true, { record })
}

async function handleDelete(record: Recordable) {
  await deleteForm(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['bpm:form:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'bpm:form:update', onClick: openForm.bind(null, record) },
              { icon: IconEnum.VIEW, label: t('action.detail'), auth: 'bpm:form:query', onClick: openDetail.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'bpm:form:delete',
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
    <BpmFormModal @register="registerModal" @success="reload()" />
  </div>
</template>
