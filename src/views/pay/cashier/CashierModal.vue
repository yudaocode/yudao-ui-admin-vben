<script lang="ts" setup>
import { ref } from 'vue'
import { QRCode } from 'ant-design-vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

const emit = defineEmits(['success', 'register'])
const { t } = useI18n()
const { createMessage } = useMessage()
const type = ref('')

const bar = ref()
const qr = ref()

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  type.value = data.type
  if (type.value === 'qrCode')
    qr.value = data.code
  else if (type.value === 'barCode')
    bar.value = data.code
  setModalProps({ confirmLoading: false })
})

async function handleSubmit() {
  try {
    setModalProps({ confirmLoading: true })
    closeModal()
    emit('success', bar.value.value)
    createMessage.success(t('common.saveSuccessText'))
  }
  finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>

<template>
  <BasicModal v-bind="$attrs" title="支付" @register="registerModal" @ok="handleSubmit">
    <QRCode v-if="type === 'qrCode'" :value="qr.value" />
    <a-input v-if="type === 'barCode'" :value="bar.value" placeholder="请输入条形码" required />
  </BasicModal>
</template>
