<script lang="ts" setup>
import { columns, searchFormSchema } from './record.data'
import { BasicTable, useTable } from '@/components/Table'
import { getSignInRecordPage } from '@/api/member/signin/record'
import { DocAlert } from '@/components/DocAlert'

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
    <DocAlert title="会员等级、积分、签到" url="https://doc.iocoder.cn/member/level/" />

    <BasicTable @register="registerTable" />
  </div>
</template>
