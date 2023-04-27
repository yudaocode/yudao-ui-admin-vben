<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="发送消息" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="MpMessageModal">
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { formSchema } from './message.data'
import { sendMessage } from '@/api/mp/message'
import { ref } from 'vue'

const { t } = useI18n()
const { createMessage } = useMessage()
const emit = defineEmits(['success', 'register'])

const userId = ref(0)

const [registerForm, { resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
  userId.value = data.record.userId
})

async function handleSubmit() {
  try {
    const values = await validate()
    values.userId = userId.value
    setModalProps({ confirmLoading: true })
    await sendMessage(values)
    closeModal()
    emit('success')
    createMessage.success(t('common.saveSuccessText'))
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
