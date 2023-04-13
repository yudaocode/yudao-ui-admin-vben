<template>
  <div>
    <BasicTable @register="registerTable" />
  </div>
</template>
<script lang="ts" setup name="BpmTodo">
import { useI18n } from '@/hooks/web/useI18n'
import { BasicTable, useTable } from '@/components/Table'
import { getTodoTaskPage } from '@/api/bpm/task'
import { columns, searchFormSchema } from './todo.data'

const { t } = useI18n()

const [registerTable] = useTable({
  title: '审批列表',
  api: getTodoTaskPage,
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
