<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="warning" v-auth="['infra:api-access-log:export']" :preIcon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts" setup name="InfraApiErrorLog">
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicTable, useTable } from '@/components/Table'
import { IconEnum } from '@/enums/appEnum'
import { getApiAccessLogPage, exportApiAccessLog, ApiAccessLogExportReqVO } from '@/api/infra/apiAccessLog'
import { columns, searchFormSchema } from './apiAccessLog.data'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerTable, { getForm }] = useTable({
  title: '访问日志列表',
  api: getApiAccessLogPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false
})

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
