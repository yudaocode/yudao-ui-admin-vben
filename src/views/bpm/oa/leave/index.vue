<template>
  <div>
    <BasicTable @register="registerTable" />
  </div>
</template>
<script lang="ts" setup name="BpmLeave">
import { useI18n } from '@/hooks/web/useI18n'
import { BasicTable, useTable } from '@/components/Table'
import { getLeavePage } from '@/api/bpm/leave'
import { columns, searchFormSchema } from './leave.data'

const { t } = useI18n()

const [registerTable] = useTable({
  title: '请假列表',
  api: getLeavePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})
</script>
