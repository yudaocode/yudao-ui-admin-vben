<script lang="ts" setup>
import { columns, searchFormSchema } from './record.data'
import { BasicTable, useTable } from '@/components/Table'
import { getRecordPage } from '@/api/member/point/record'

defineOptions({ name: 'PointRecord' })

const [registerTable, { reload }] = useTable({
  title: '积分记录列表',
  api: getRecordPage,
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
