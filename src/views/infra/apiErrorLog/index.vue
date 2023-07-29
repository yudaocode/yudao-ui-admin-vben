<script lang="ts" setup>
import { columns, searchFormSchema } from './apiErrorLog.data'
import ErrorLogModal from './ErrorLogModal.vue'
import { useI18n } from '@/hooks/web/useI18n'
import { IconEnum } from '@/enums/appEnum'
import { InfraApiErrorLogProcessStatusEnum } from '@/enums/systemEnum'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import type { ApiErrorLogExportReqVO } from '@/api/infra/apiErrorLog'
import { exportApiErrorLog, getApiErrorLogPage, updateApiErrorLogProcess } from '@/api/infra/apiErrorLog'
import { useModal } from '@/components/Modal'

defineOptions({ name: 'InfraApiErrorLog' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerTable, { getForm, reload }] = useTable({
  title: '异常日志列表',
  api: getApiErrorLogPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 220,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

const [registerModal, { openModal }] = useModal()
function handleShowInfo(record: Recordable) {
  openModal(true, record)
}

function handleProcessClick(record, processStatus: number, type: string) {
  createConfirm({
    iconType: 'warning',
    content: `确认标记为${type}?`,
    async onOk() {
      await updateApiErrorLogProcess(record.id, processStatus)
      createMessage.success(t('common.successText'))
      reload()
    },
  })
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportApiErrorLog(getForm().getFieldsValue() as ApiErrorLogExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    },
  })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['infra:api-error-log:export']" type="warning" :pre-icon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.VIEW,
                label: t('action.detail'),
                onClick: handleShowInfo.bind(null, record),
              },
              {
                icon: IconEnum.EDIT,
                label: '已处理',
                auth: 'infra:api-error-log:update-status',
                ifShow: () => record.processStatus === InfraApiErrorLogProcessStatusEnum.INIT,
                onClick: handleProcessClick.bind(null, record, InfraApiErrorLogProcessStatusEnum.DONE, '已处理'),
              },
              {
                icon: IconEnum.EDIT,
                label: '已忽略',
                auth: 'infra:api-error-log:update-status',
                ifShow: () => record.processStatus === InfraApiErrorLogProcessStatusEnum.INIT,
                onClick: handleProcessClick.bind(null, record, InfraApiErrorLogProcessStatusEnum.IGNORE, '已忽略'),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <ErrorLogModal @register="registerModal" />
  </div>
</template>
