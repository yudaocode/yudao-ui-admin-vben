<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="编辑" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="MpUserModal">
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { formSchema } from './mpuser.data'
import { getUser, updateUser } from '@/api/mp/mpuser'

const { t } = useI18n()
const { createMessage } = useMessage()
const emit = defineEmits(['success', 'register'])

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
  const res = await getUser(data.record.id)
  setFieldsValue({ ...res })
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    await updateUser(values)
    closeModal()
    emit('success')
    createMessage.success(t('common.saveSuccessText'))
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
