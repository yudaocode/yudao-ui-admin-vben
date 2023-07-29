<script lang="ts" setup>
import { columns, searchFormSchema } from './done.data'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { IconEnum } from '@/enums/appEnum'
import { getDoneTaskPage } from '@/api/bpm/task'

defineOptions({ name: 'BpmDoneTask' })

const go = useGo()
const { t } = useI18n()

const [registerTable] = useTable({
  title: '审批列表',
  api: getDoneTaskPage,
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

function openDetail(record: Recordable) {
  console.info(record)
}

function handleAudit(record: Recordable) {
  go({ name: 'BpmProcessInstanceDetail', query: { id: record.id } })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.VIEW, label: '详情', onClick: openDetail.bind(null, record) },
              { icon: IconEnum.VIEW, label: '流程', onClick: handleAudit.bind(null, record) },
            ]"
          />
        </template>
      </template>
    </BasicTable>
  </div>
</template>
