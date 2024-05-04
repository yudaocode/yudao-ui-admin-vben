<script lang="ts" setup>
import { columns, searchFormSchema } from './done.data'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { IconEnum } from '@/enums/appEnum'
import { getDoneTaskPage } from '@/api/bpm/task'
import { DocAlert } from '@/components/DocAlert'

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
    <DocAlert title="审批通过、不通过、驳回" url="https://doc.iocoder.cn/bpm/task-todo-done/" />
    <DocAlert title="审批加签、减签" url="https://doc.iocoder.cn/bpm/sign/" />
    <DocAlert
      title="审批转办、委派、抄送"
      url="https://doc.iocoder.cn/bpm/task-delegation-and-cc/"
    />
    <DocAlert title="审批加签、减签" url="https://doc.iocoder.cn/bpm/sign/" />

    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.VIEW, label: t('action.detail'), onClick: openDetail.bind(null, record) },
              { icon: IconEnum.VIEW, label: '流程', onClick: handleAudit.bind(null, record) },
            ]"
          />
        </template>
      </template>
    </BasicTable>
  </div>
</template>
