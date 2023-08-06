<script lang="ts" setup>
import { columns, searchFormSchema } from './smsLog.data'
import { BasicTable, useTable } from '@/components/Table'
import { IconEnum } from '@/enums/appEnum'
import type { SmsLogExportReqVO } from '@/api/system/sms/smsLog'
import { exportSmsLog, getSmsLogPage } from '@/api/system/sms/smsLog'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'SystemSmsLog' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerTable, { getForm }] = useTable({
  title: '短信日志列表',
  api: getSmsLogPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
})

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportSmsLog(getForm().getFieldsValue() as SmsLogExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    },
  })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['system:sms-log:export']" type="warning" :pre-icon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
    </BasicTable>
  </div>
</template>
