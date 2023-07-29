<script lang="ts" setup>
import { columns, searchFormSchema } from './todo.data'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { IconEnum } from '@/enums/appEnum'
import { getTodoTaskPage } from '@/api/bpm/task'

defineOptions({ name: 'BpmTodoTask' })

const go = useGo()
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
    fixed: 'right',
  },
})

function handleAudit(record: Recordable) {
  go({ name: 'BpmProcessInstanceDetail', query: { id: record.id } })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="[{ icon: IconEnum.VIEW, label: '审批进度', onClick: handleAudit.bind(null, record) }]" />
        </template>
      </template>
    </BasicTable>
  </div>
</template>
