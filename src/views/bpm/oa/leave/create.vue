<script lang="ts" setup>
import { onMounted } from 'vue'
import { formSchema } from './leave.data'
import { BasicForm, useForm } from '@/components/Form'
import { PageWrapper } from '@/components/Page'
import { createLeave } from '@/api/bpm/leave'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'LeaveCreate' })
const { t } = useI18n()
const { createMessage } = useMessage()

const [registerForm, { resetFields, validate }] = useForm({
  labelWidth: 140,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showResetButton: false,
  submitButtonOptions: { text: t('common.saveText') },
  actionColOptions: { span: 23 },
})

async function handleSubmit() {
  try {
    const values = await validate()
    await createLeave(values)
  }
  finally {
    createMessage.success(t('common.saveSuccessText'))
  }
}

onMounted(() => {
  resetFields()
})
</script>

<template>
  <PageWrapper>
    <BasicForm class="mt-10 h-120 w-200" @register="registerForm" @submit="handleSubmit" />
  </PageWrapper>
</template>
