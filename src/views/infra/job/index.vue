<script lang="ts" setup>
import JobModal from './JobModal.vue'
import { columns, searchFormSchema } from './job.data'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import type { JobExportReqVO } from '@/api/infra/job'
import { deleteJob, exportJob, getJobPage, runJob, updateJobStatus } from '@/api/infra/job'
import { InfraJobStatusEnum } from '@/enums/systemEnum'

defineOptions({ name: 'InfraJob' })

const go = useGo()
const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { getForm, reload }] = useTable({
  title: '定时任务列表',
  api: getJobPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

function handleCreate() {
  openModal(true, { isEdit: true, isUpdate: false })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isEdit: true, isUpdate: true })
}

function handleChangeStatus(record: Recordable, open: boolean) {
  const status = open ? InfraJobStatusEnum.NORMAL : InfraJobStatusEnum.STOP
  const statusStr = open ? '开启' : '关闭'
  createConfirm({
    title: '调整状态',
    iconType: 'warning',
    content: `是否确认${statusStr}定时任务编号为"${record.id}"的数据项?`,
    async onOk() {
      await updateJobStatus(record.id, status)
      createMessage.success(t('common.successText'))
      reload()
    },
  })
}

function handleRun(record: Recordable) {
  createConfirm({
    title: '执行',
    iconType: 'warning',
    content: `确认要立即执行一次"${record.name}"任务吗?`,
    async onOk() {
      await runJob(record.id)
      createMessage.success(t('common.successText'))
    },
  })
}

function handleView(record: Recordable) {
  openModal(true, { record, isEdit: false })
}

function handleJobLog(record: Recordable) {
  if (record.id > 0)
    go(`/job/job-log?id=${record.id}`)
  else
    go('/job/job-log')
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportJob(getForm().getFieldsValue() as JobExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    },
  })
}

async function handleDelete(record: Recordable) {
  await deleteJob(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['infra:job:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <a-button v-auth="['infra:job:export']" type="warning" :pre-icon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[{ icon: IconEnum.EDIT, label: t('action.edit'), onClick: handleEdit.bind(null, record) }]"
            :drop-down-actions="[
              { icon: IconEnum.AUTH, label: '开启', auth: 'infra:job:update', onClick: handleChangeStatus.bind(null, record, true) },
              { icon: IconEnum.EDIT, label: '暂停', auth: 'infra:job:update', onClick: handleChangeStatus.bind(null, record, false) },
              { icon: IconEnum.TEST, label: '执行一次', auth: 'infra:job:trigger', onClick: handleRun.bind(null, record) },
              { icon: IconEnum.PREVIEW, label: '任务详细', auth: 'infra:job:query', onClick: handleView.bind(null, record) },
              { icon: IconEnum.LOG, label: '调度日志', auth: 'infra:job:query', onClick: handleJobLog.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'infra:job:delete',
                popConfirm: {
                  title: t('common.delMessage'),
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <JobModal @register="registerModal" @success="reload()" />
  </div>
</template>
