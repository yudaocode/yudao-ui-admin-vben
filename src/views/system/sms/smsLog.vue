<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="warning" @click="handleExport"> 导出 </a-button>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts" setup name="SmsLog">
import { BasicTable, useTable } from '@/components/Table'
import { SmsLogExportReqVO, exportSmsLogApi, getSmsLogPageApi } from '@/api/system/sms/smsLog'
import { columns, searchFormSchema } from './smsLog.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerTable, { getForm }] = useTable({
  title: '短信日志列表',
  api: getSmsLogPageApi,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false
})

async function handleExport() {
  createConfirm({
    title: '导出',
    iconType: 'warning',
    content: '是否要导出数据？',
    async onOk() {
      await exportSmsLogApi(getForm().getFieldsValue() as SmsLogExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}
</script>
