<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="isUpdate ? '编辑' : '新增'" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #editor="{ model, field }">
        <Tinymce v-model="model[field]" width="100%" />
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="SystemNoticeModal">
import { ref, unref } from 'vue'
import { Tinymce } from '@/components/Tinymce'
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, useForm } from '@/components/Form'
import { formSchema } from './notice.data'
import { createNotice, getNotice, updateNotice } from '@/api/system/notice'

const emit = defineEmits(['success', 'register'])
const isUpdate = ref(true)

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
  isUpdate.value = !!data?.isUpdate
  if (unref(isUpdate)) {
    const res = await getNotice(data.record.id)
    setFieldsValue({ ...res })
  }
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    if (unref(isUpdate)) {
      await updateNotice(values)
    } else {
      await createNotice(values)
    }
    closeModal()
    emit('success')
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
