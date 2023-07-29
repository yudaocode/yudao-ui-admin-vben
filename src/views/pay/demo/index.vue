<script lang="ts" setup>
import DemoModal from './DemoModal.vue'
import { columns, searchFormSchema } from './demo.data'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getDemoOrderPage, refundDemoOrder } from '@/api/pay/demo'

defineOptions({ name: 'PayDemo' })

const go = useGo()
const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '接入示例列表',
  api: getDemoOrderPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 180,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

function handleAdd() {
  openModal(true)
}

/** 支付按钮操作 */
function handlePay(record: Recordable) {
  go(`/cashRegister/submit?id=${record.id}`)
}

/** 退款按钮操作 */
async function handleRefund(record: Recordable) {
  createConfirm({
    title: '退款',
    iconType: 'warning',
    content: `是否确认退款编号为"${record.id}"的示例订单?`,
    async onOk() {
      await refundDemoOrder(record.id)
      createMessage.success(t('common.successText'))
      reload()
    },
  })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['pay:app:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleAdd">
          发起订单
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.EDIT,
                label: '前往支付',
                ifShow: () => {
                  return !record.payed
                },
                onClick: handlePay.bind(null, record),
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: '发起退款',
                ifShow: () => {
                  return record.payed && !record.payRefundId
                },
                onClick: handleRefund.bind(null, record),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <DemoModal @register="registerModal" @success="reload()" />
  </div>
</template>
