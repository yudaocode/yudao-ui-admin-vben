<template>
  <div>
    <BasicTable @register="registerTable" />
  </div>
</template>
<script lang="ts" setup>
import { BasicTable, useTable } from '@/components/Table'
import { getMailAccountPage } from '@/api/system/mail/log'
import { columns, searchFormSchema } from './mailLog.data'

defineOptions({ name: 'SystemOperateLog' })

const [registerTable] = useTable({
  title: '邮件日志列表',
  api: getMailAccountPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false
})
</script>
