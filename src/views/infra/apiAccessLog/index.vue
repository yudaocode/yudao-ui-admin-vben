<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="warning" v-auth="['infra:api-access-log:export']" :preIcon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.VIEW,
                label: t('action.detail'),
                onClick: handleShowInfo.bind(null, record)
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <AccessLogModal @register="registerModal" />
  </div>
</template>
<script lang="ts" setup>
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { IconEnum } from '@/enums/appEnum'
import { getApiAccessLogPage, exportApiAccessLog, ApiAccessLogExportReqVO } from '@/api/infra/apiAccessLog'
import { columns, searchFormSchema } from './apiAccessLog.data'
import { useModal } from '@/components/Modal'
import AccessLogModal from './AccessLogModal.vue'

defineOptions({ name: 'InfraApiErrorLog' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerTable, { getForm }] = useTable({
  title: '访问日志列表',
  api: getApiAccessLogPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
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

const [registerModal, { openModal }] = useModal()
function handleShowInfo(record: Recordable) {
  openModal(true, record)
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportApiAccessLog(getForm().getFieldsValue() as ApiAccessLogExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}
</script>
