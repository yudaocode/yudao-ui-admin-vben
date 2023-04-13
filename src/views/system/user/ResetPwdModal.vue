<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="重置密码" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="SystemResetPwdModal">
import { ref } from 'vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, useForm } from '@/components/Form'
import { userPwdFormSchema } from './user.data'
import { resetUserPwd } from '@/api/system/user'

const emit = defineEmits(['success', 'register'])

const userId = ref(0)

const [registerForm, { resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: userPwdFormSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
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
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
