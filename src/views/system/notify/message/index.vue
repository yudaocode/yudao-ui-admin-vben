<template>
  <div>
    <BasicTable @register="registerTable" />
  </div>
</template>
<script lang="ts" setup name="SystemMessage">
import { BasicTable, useTable } from '@/components/Table'
import { getNotifyMessagePage } from '@/api/system/notify/message'
import { columns, searchFormSchema } from './message.data'

const [registerTable] = useTable({
  title: '站内信记录列表',
  api: getNotifyMessagePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false
})
</script>
