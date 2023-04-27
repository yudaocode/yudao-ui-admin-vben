<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="isUpdate ? t('action.edit') : t('action.create')" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="DeptModal">
import { ref, unref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { formSchema } from './dept.data'
import { createDept, getDept, updateDept } from '@/api/system/dept'

const { t } = useI18n()
const { createMessage } = useMessage()
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
    const res = await getDept(data.record.id)
    setFieldsValue({ ...res })
  }
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    if (unref(isUpdate)) {
      await updateDept(values)
    } else {
      await createDept(values)
    }
    closeModal()
    emit('success')
    createMessage.success(t('common.saveSuccessText'))
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
