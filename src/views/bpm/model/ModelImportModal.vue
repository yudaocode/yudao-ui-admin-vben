<script lang="ts" setup>
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import type { FormSchema } from '@/components/Form'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { importModel } from '@/api/bpm/model'

defineOptions({ name: 'ModelImportForm' })

const emit = defineEmits(['success', 'register'])

const formSchema: FormSchema[] = [
  {
    label: '流程标识',
    field: 'key',
    component: 'Input',
    required: true,
  },
  {
    label: '流程名称',
    field: 'name',
    component: 'Input',
    required: true,
  },
  {
    label: '流程描述',
    field: 'description',
    component: 'Input',
  },
  {
    label: '流程文件',
    field: 'bpmnFile',
    component: 'FileUpload',
    componentProps: {
      maxCount: 1,
      fileType: 'file',
    },
  },
]

const { t } = useI18n()
const { createMessage } = useMessage()

const [registerForm, { resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 },
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(() => {
  resetFields()
  setModalProps({ confirmLoading: false })
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    console.info(values)
    await importModel(values)
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
  <BasicModal v-bind="$attrs" title="导入流程" @register="registerModal" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
