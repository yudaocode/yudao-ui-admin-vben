<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="MailAccountModal">
import { ref, computed, unref } from 'vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, useForm } from '@/components/Form'
import { formSchema } from './account.data'
import { createMailAccountApi, getMailAccountApi, updateMailAccountApi } from '@/api/system/mail/account'

const emit = defineEmits(['success', 'register'])
const isUpdate = ref(true)
const rowId = ref()

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 100,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: {
    span: 23
  }
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
  isUpdate.value = !!data?.isUpdate

  if (unref(isUpdate)) {
    const res = await getMailAccountApi(data.record.id)
    rowId.value = res.id
    setFieldsValue({
      ...res
    })
  }
})

const getTitle = computed(() => (!unref(isUpdate) ? '新增邮箱' : '编辑邮箱'))

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    if (unref(isUpdate)) {
      await updateMailAccountApi(values)
    } else {
      await createMailAccountApi(values)
    }
    closeModal()
    emit('success')
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
