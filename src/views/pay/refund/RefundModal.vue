<template>
  <BasicModal v-bind="$attrs" width="60%" @register="registerModal" title="查看详情" @ok="handleSubmit">
    <Description :bordered="false" :column="3" :data="refundData" :schema="descSchema" />
  </BasicModal>
</template>
<script lang="ts" setup name="RefundModal">
import { ref } from 'vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description } from '@/components/Description'
import { descSchema } from './refund.data'
import { getRefund } from '@/api/pay/refund'

const emit = defineEmits(['success', 'register'])

const refundData = ref()

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  setModalProps({ confirmLoading: false })
  const res = await getRefund(data.record.id)
  refundData.value = res
})

async function handleSubmit() {
  closeModal()
  emit('success')
  setModalProps({ confirmLoading: false })
}
</script>
