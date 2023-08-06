<script lang="ts" setup>
import PreviewModal from './components/PreviewModal.vue'
import ImportTableModal from './components/ImportTableModal.vue'
import { columns, searchFormSchema } from './codegen.data'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteCodegenTable, downloadCodegen, getCodegenTablePage, syncCodegenFromDB } from '@/api/infra/codegen'

defineOptions({ name: 'InfraCodegen' })

const go = useGo()
const { t } = useI18n()
const { createMessage } = useMessage()
const [registerPreviewModal, { openModal: openPreviewModal }] = useModal()
const [registerImportTableModal, { openModal: openImportTableModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '代码生成列表',
  api: getCodegenTablePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 360,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

function handlePreview(record: Recordable) {
  openPreviewModal(true, {
    record,
  })
}

function handleEditTable(record: Recordable) {
  go(`/codegen/editTable?id=${record.id}`)
}

async function handleGenTable(record: Recordable) {
  await downloadCodegen(record)
  createMessage.success(t('common.successText'))
}

async function handleSynchDb(record: Recordable) {
  await syncCodegenFromDB(record.id)
  createMessage.success(t('common.successText'))
  reload()
}

async function handleDelete(record: Recordable) {
  await deleteCodegenTable(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['infra:codegen:create']" type="primary" :pre-icon="IconEnum.IMPORT" @click="openImportTableModal(true)">
          {{ t('action.import') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.PREVIEW, label: '预览', auth: 'infra:codegen:preview', onClick: handlePreview.bind(null, record) },
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'infra:codegen:update', onClick: handleEditTable.bind(null, record) },
              { icon: IconEnum.DOWNLOAD, label: '生成', auth: 'infra:codegen:download', onClick: handleGenTable.bind(null, record) },
              {
                icon: IconEnum.RESET,
                label: t('action.sync'),
                auth: 'infra:codegen:update',
                popConfirm: {
                  title: `确认要强制同步${record.tableName}表结构吗？`,
                  placement: 'left',
                  confirm: handleSynchDb.bind(null, record),
                },
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'infra:codegen:delete',
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
    <PreviewModal @register="registerPreviewModal" />
    <ImportTableModal @register="registerImportTableModal" @success="reload()" />
  </div>
</template>
