<script lang="ts" setup>
import SensitiveWordModal from './SensitiveWordModal.vue'
import { columns, searchFormSchema } from './sensitiveWord.data'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import type { SensitiveWordExportReqVO } from '@/api/system/sensitiveWord'
import { deleteSensitiveWord, exportSensitiveWord, getSensitiveWordPage } from '@/api/system/sensitiveWord'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'SystemSensitiveWord' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const [registerTable, { getForm, reload }] = useTable({
  title: '敏感词列表',
  api: getSensitiveWordPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
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
      await exportSensitiveWord(getForm().getFieldsValue() as SensitiveWordExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    },
  })
}

async function handleDelete(record: Recordable) {
  await deleteSensitiveWord(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['system:sensitive-word:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <a-button v-auth="['system:sensitive-word:export']" type="warning" :pre-icon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.EDIT,
                label: t('action.edit'),
                auth: 'system:sensitive-word:delete',
                onClick: handleEdit.bind(null, record),
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'system:sensitive-word:delete',
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
    <SensitiveWordModal @register="registerModal" @success="reload()" />
  </div>
</template>
