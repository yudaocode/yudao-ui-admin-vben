<script lang="ts" setup>
import { columns, searchFormSchema } from './record.data'
import { BasicTable, useTable } from '@/components/Table'
import { getSignInRecordPage } from '@/api/member/signin/record'

defineOptions({ name: 'SignInRecord' })

const [registerTable] = useTable({
  title: '签到记录列表',
  api: getSignInRecordPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
})
</script>

<template>
  <div>
    <BasicTable @register="registerTable" />
  </div>
</template>
