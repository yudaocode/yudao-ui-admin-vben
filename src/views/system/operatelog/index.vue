<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="warning" :preIcon="IconEnum.EXPORT" @click="handleExport"> {{ t('action.export') }} </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.VIEW,
                label: t('action.detail'),
                onClick: handleShowInfo.bind(null, record)
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <OperLogInfoModal @register="registerModal" />
  </div>
</template>
<script lang="ts" setup>
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { OperateLogPageReqVO, exportOperateLog, getOperateLogPage } from '@/api/system/operatelog'
import { columns, searchFormSchema } from './operateLog.data'
import { useModal } from '@/components/Modal'
import OperLogInfoModal from './LogInfoModal.vue'

defineOptions({ name: 'SystemOperateLog' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerTable, { getForm }] = useTable({
  title: '操作日志列表',
  api: getOperateLogPage,
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

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportOperateLog(getForm().getFieldsValue() as OperateLogPageReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}

const [registerModal, { openModal }] = useModal()
function handleShowInfo(record: Recordable) {
  openModal(true, record)
}
</script>
