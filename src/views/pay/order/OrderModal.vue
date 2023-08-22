<script lang="ts" setup>
import { ref } from 'vue'
import { descSchema } from './order.data'
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description } from '@/components/Description'
import { getOrderDetail } from '@/api/pay/order'

defineOptions({ name: 'PayRefundModal' })

const refundData = ref()

const [registerModal, { setModalProps }] = useModalInner(async (data) => {
  setModalProps({ confirmLoading: false })
  const res = await getOrderDetail(data.record.id)
  refundData.value = res
})
</script>

<template>
  <BasicModal v-bind="$attrs" width="60%" title="查看详情" :show-ok-btn="false" @register="registerModal">
    <Description :bordered="false" :column="2" :data="refundData" :schema="descSchema" />
  </BasicModal>
</template>
