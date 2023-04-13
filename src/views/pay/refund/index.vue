<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="warning" v-auth="['pay:order:export']" :preIcon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.DATA, label: t('action.detail'), auth: 'pay:order:query', onClick: handleQueryDetails.bind(null, record) }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <RefundModal @register="registerModal" />
  </div>
</template>
<script lang="ts" setup name="PayRefund">
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import RefundModal from './RefundModal.vue'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { getRefundPage, exportRefund, PayRefundExportReqVO } from '@/api/pay/refund'
import { columns, searchFormSchema } from './refund.data'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { getForm }] = useTable({
  title: '退款列表',
  api: getRefundPage,
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

function handleQueryDetails(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportRefund(getForm().getFieldsValue() as PayRefundExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}
</script>
