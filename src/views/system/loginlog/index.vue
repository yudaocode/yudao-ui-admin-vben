<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="warning" v-auth="['system:login-log:export']" @click="handleExport"> {{ t('action.export') }} </a-button>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts" setup name="SystemLoginLog">
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicTable, useTable } from '@/components/Table'
import { LoginLogReqVO, exportLoginLog, getLoginLogPage } from '@/api/system/loginLog'
import { columns, searchFormSchema } from './loginLog.data'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerTable, { getForm }] = useTable({
  title: '登录日志列表',
  api: getLoginLogPage,
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
      await exportLoginLog(getForm().getFieldsValue() as LoginLogReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}
</script>
