<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate"> {{ t('action.create') }} </a-button>
        <a-button type="warning" @click="handleExport"> {{ t('action.export') }} </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                label: t('action.edit'),
                onClick: handleEdit.bind(null, record)
              },
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
    <TenantModel @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="Tenant">
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { TenantExportReqVO, deleteTenantApi, exportTenantApi, getTenantPageApi } from '@/api/system/tenant'
import { useModal } from '@/components/Modal'
import TenantModel from './TenantModel.vue'
import { columns, searchFormSchema } from './tenant.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const [registerTable, { getForm, reload }] = useTable({
  title: '租户列表',
  api: getTenantPageApi,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 120,
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

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportTenantApi(getForm().getFieldsValue() as TenantExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}

async function handleDelete(record: Recordable) {
  await deleteTenantApi(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
