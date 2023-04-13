<template>
  <BasicModal v-bind="$attrs" width="60%" @register="registerModal" title="查看详情" :showOkBtn="false">
    <Description :bordered="false" :column="3" :data="refundData" :schema="descSchema" />
  </BasicModal>
</template>
<script lang="ts" setup name="PayRefundModal">
import { ref } from 'vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description } from '@/components/Description'
import { descSchema } from './refund.data'
import { getRefund } from '@/api/pay/refund'

const refundData = ref()

const [registerModal, { setModalProps }] = useModalInner(async (data) => {
  setModalProps({ confirmLoading: false })
  const res = await getRefund(data.record.id)
  refundData.value = res
})
</script>
