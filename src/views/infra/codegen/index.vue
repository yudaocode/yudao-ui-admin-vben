<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" :preIcon="IconEnum.IMPORT" @click="handleCreate"> {{ t('action.import') }} </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), onClick: handleEdit.bind(null, record) },
              {
                icon: IconEnum.DELETE,
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
    <CodegenModal @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="Codegen">
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import CodegenModal from './CodegenModal.vue'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { deleteCodegenTable, getCodegenTablePage } from '@/api/infra/codegen'
import { columns, searchFormSchema } from './codegen.data'

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '代码生成列表',
  api: getCodegenTablePage,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
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

function handleEdit(record: Recordable) {
  openModal(true, {
    record,
    isUpdate: true
  })
}

async function handleDelete(record: Recordable) {
  await deleteCodegenTable(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
