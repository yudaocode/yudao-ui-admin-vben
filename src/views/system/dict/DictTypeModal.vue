<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="isUpdate ? t('action.edit') : t('action.create')" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="SystemDictTypeModal">
import { ref, unref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { typeFormSchema } from './dict.type'
import { createDictType, getDictType, updateDictType } from '@/api/system/dict/type'

const { t } = useI18n()
const { createMessage } = useMessage()
const emit = defineEmits(['success', 'register'])
const isUpdate = ref(true)

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: typeFormSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
  isUpdate.value = !!data?.isUpdate
  if (unref(isUpdate)) {
    const res = await getDictType(data.record.id)
    setFieldsValue({ ...res })
  }
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    if (unref(isUpdate)) {
      await updateDictType(values)
    } else {
      await createDictType(values)
    }
    closeModal()
    emit('success')
    createMessage.success(t('common.saveSuccessText'))
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
