<script lang="ts" setup>
import { useRoute } from 'vue-router'
import JobLogModal from './JobLogModal.vue'
import { columns, searchFormSchema } from './jobLog.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import type { JobLogExportReqVO } from '@/api/infra/jobLog'
import { exportJobLog, getJobLogPage } from '@/api/infra/jobLog'

defineOptions({ name: 'InfraJobLog' })

const { t } = useI18n()
const { query } = useRoute()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { getForm, reload }] = useTable({
  title: '定时任务日志列表',
  api: getJobLogPage,
  searchInfo: { id: query.id as unknown as number },
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

function handleDetail(record: Recordable) {
  openModal(true, { record })
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportJobLog(getForm().getFieldsValue() as JobLogExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    },
  })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['infra:job:export']" type="warning" :pre-icon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="[{ icon: IconEnum.EDIT, label: t('action.detail'), onClick: handleDetail.bind(null, record) }]" />
        </template>
      </template>
    </BasicTable>
    <JobLogModal @register="registerModal" @success="reload()" />
  </div>
</template>
