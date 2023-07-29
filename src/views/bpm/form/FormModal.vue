<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { VFormCreate } from '@/components/FormDesign'
import { BasicModal, useModalInner } from '@/components/Modal'
import { getForm } from '@/api/bpm/form'

defineOptions({ name: 'BpmFormModal' })

const emit = defineEmits(['success', 'register'])
const { t } = useI18n()
const { createMessage } = useMessage()
const formConfig = ref({
  schemas: [],
  rule: [],
  option: {},
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  setModalProps({ confirmLoading: false })
  const res = await getForm(data.record.id)
  formConfig.value.schemas = res.fields
  formConfig.value.option = res.conf
})

async function handleSubmit() {
  try {
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
  <BasicModal v-bind="$attrs" title="表单详情" @register="registerModal" @ok="handleSubmit">
    <VFormCreate :form-config="formConfig" />
  </BasicModal>
</template>
