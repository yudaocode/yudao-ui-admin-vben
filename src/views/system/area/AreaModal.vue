<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="IP 查询" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="AreaModal">
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, useForm } from '@/components/Form'
import { formSchema } from './area.data'
import { getAreaByIp } from '@/api/system/area'

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 100,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
})

const [registerModal, { setModalProps }] = useModalInner(async () => {
  resetFields()
  setModalProps({ confirmLoading: false })
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    const res = getAreaByIp(values.ip)
    if (res) {
      values.result = res
      setFieldsValue({ ...values })
    }
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
