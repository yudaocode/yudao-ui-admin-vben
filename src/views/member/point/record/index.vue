<script lang="ts" setup>
import { columns, searchFormSchema } from './record.data'
import { BasicTable, useTable } from '@/components/Table'
import { getRecordPage } from '@/api/member/point/record'
import { DocAlert } from '@/components/DocAlert'

defineOptions({ name: 'PointRecord' })

const [registerTable] = useTable({
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
    <DocAlert title="会员等级、积分、签到" url="https://doc.iocoder.cn/member/level/" />

    <BasicTable @register="registerTable" />
  </div>
</template>
