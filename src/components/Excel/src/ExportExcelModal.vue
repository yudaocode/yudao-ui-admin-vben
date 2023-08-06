<script lang="ts" setup>
import type { ExportModalResult } from './typing'
import { BasicModal, useModalInner } from '@/components/Modal'
import type { FormSchema } from '@/components/Form'
import { BasicForm, useForm } from '@/components/Form'
import { useI18n } from '@/hooks/web/useI18n'

const emit = defineEmits(['success', 'register'])
const { t } = useI18n()
const schemas: FormSchema[] = [
  {
    field: 'filename',
    component: 'Input',
    label: t('component.excel.fileName'),
    rules: [{ required: true }],
  },
  {
    field: 'bookType',
    component: 'Select',
    label: t('component.excel.fileType'),
    defaultValue: 'xlsx',
    rules: [{ required: true }],
    componentProps: {
      options: [
        {
          label: 'xlsx',
          value: 'xlsx',
          key: 'xlsx',
        },
        {
          label: 'html',
          value: 'html',
          key: 'html',
        },
        {
          label: 'csv',
          value: 'csv',
          key: 'csv',
        },
        {
          label: 'txt',
          value: 'txt',
          key: 'txt',
        },
      ],
    },
  },
]
const [registerForm, { validateFields }] = useForm()
const [registerModal, { closeModal }] = useModalInner()

async function handleOk() {
  const res = (await validateFields()) as ExportModalResult
  const { filename, bookType } = res
  emit('success', {
    filename: `${filename.split('.').shift()}.${bookType}`,
    bookType,
  })
  closeModal()
}
</script>

<template>
  <BasicModal v-bind="$attrs" :title="t('component.excel.exportModalTitle')" @ok="handleOk" @register="registerModal">
    <BasicForm :label-width="100" :schemas="schemas" :show-action-button-group="false" @register="registerForm" />
  </BasicModal>
</template>
