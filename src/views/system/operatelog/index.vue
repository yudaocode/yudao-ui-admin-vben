<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="warning" :preIcon="IconEnum.EXPORT" @click="handleExport"> {{ t('action.export') }} </a-button>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts" setup name="SystemOperateLog">
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable } from '@/components/Table'
import { OperateLogPageReqVO, exportOperateLog, getOperateLogPage } from '@/api/system/operatelog'
import { columns, searchFormSchema } from './operateLog.data'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerTable, { getForm }] = useTable({
  title: '操作日志列表',
  api: getOperateLogPage,
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
      await exportOperateLog(getForm().getFieldsValue() as OperateLogPageReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}
</script>
