<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="warning" v-auth="['infra:job:export']" :preIcon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="[{ icon: IconEnum.EDIT, label: t('action.detail'), onClick: handleDetail.bind(null, record) }]" />
        </template>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts" setup name="InfraJobLog">
import { useRoute } from 'vue-router'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { JobLogExportReqVO, exportJobLog, getJobLogPage } from '@/api/infra/jobLog'
import { columns, searchFormSchema } from './jobLog.data'

const { t } = useI18n()
const { query } = useRoute()
const { createConfirm, createMessage } = useMessage()

const [registerTable, { getForm }] = useTable({
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
    fixed: 'right'
  }
})

function handleDetail() {
  console.info('detail')
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportJobLog(getForm().getFieldsValue() as JobLogExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}
</script>
