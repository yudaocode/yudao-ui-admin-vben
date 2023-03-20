<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="warning" @click="handleExport"> 导出 </a-button>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts" setup name="Post">
import { BasicTable, useTable } from '@/components/Table'
import { LoginLogReqVO, exportLoginLogApi, getLoginLogPageApi } from '@/api/system/loginLog'
import { columns, searchFormSchema } from './loginLog.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerTable, { getForm }] = useTable({
  title: '登录日志列表',
  api: getLoginLogPageApi,
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
      await exportLoginLogApi(getForm().getFieldsValue() as LoginLogReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}
</script>
