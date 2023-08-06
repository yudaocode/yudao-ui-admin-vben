<script lang="ts" setup>
import { ref } from 'vue'
import { userPwdFormSchema } from './user.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { resetUserPwd } from '@/api/system/user'

defineOptions({ name: 'SystemResetPwdModal' })

const emit = defineEmits(['success', 'register'])
const { t } = useI18n()
const { createMessage } = useMessage()
const userId = ref(0)

const [registerForm, { resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: userPwdFormSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 },
})

const [registerModal, { setModalProps, closeModal }] = useModalInner((data) => {
  resetFields()
  userId.value = data.record.id
  setModalProps({ confirmLoading: false })
})

async function handleSubmit() {
  try {
    const values = await validate()
    await resetUserPwd(userId.value, values.newPassword)
    setModalProps({ confirmLoading: true })
    closeModal()
    emit('success')
    createMessage.success(t('common.saveSuccessText'))
  }
  finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>

<template>
  <BasicModal v-bind="$attrs" title="重置密码" @register="registerModal" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
