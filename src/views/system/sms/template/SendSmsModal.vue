<template>
  <BasicModal v-bind="$attrs" title="测试发送短信" @register="innerRegister" @ok="submit">
    <BasicForm @register="register" :schemas="reactiveSchemas" />
  </BasicModal>
</template>

<script setup lang="ts">
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, FormSchema, useForm } from '@/components/Form'
import { reactive, ref } from 'vue'
import { SmsTemplateVO, sendSms } from '@/api/system/sms/smsTemplate'
import { useMessage } from '@/hooks/web/useMessage'
import { baseSendSchemas } from './smsTemplate.data'

defineOptions({ name: 'SendSmsModal' })

const { createMessage } = useMessage()
let reactiveSchemas: FormSchema[] = reactive([])
const templateCode = ref<string>('')

const [register, { setFieldsValue, getFieldsValue, validateFields, resetFields, clearValidate, setProps }] = useForm({
  labelWidth: 100,
  baseColProps: {
    span: 24
  },
  showSubmitButton: false,
  showResetButton: false
})

const [innerRegister, { changeLoading, closeModal }] = useModalInner((data: SmsTemplateVO) => {
  resetForm()
  data.params.forEach((item) => {
    const dySchema: FormSchema = {
      // 这里加上前缀 防止content/mobile和字段重名
      field: `key-${item}`,
      label: `参数{${item}} `,
      component: 'Input',
      componentProps: {
        placeholder: `输入{${item}}`
      },
      required: true
    }
    reactiveSchemas.push(dySchema)
  })
  const { content, code } = data
  setFieldsValue({ content })
  templateCode.value = code
})

const submit = async () => {
  try {
    setProps({ disabled: true })
    changeLoading(true)
    await validateFields()
    const fields = getFieldsValue()
    const data = {
      mobile: fields.mobile,
      templateCode: templateCode.value,
      templateParams: {}
    }
    Object.keys(fields).forEach((key) => {
      if (key === 'content' || key === 'mobile') {
        return
      }
      // 去掉 - 后的key
      const realKey = key.split('-')[1]
      data.templateParams[realKey] = fields[key]
    })
    await sendSms(data)
    createMessage.success(`发送短信到[${fields.mobile}]成功`)
    closeModal()
  } finally {
    setProps({ disabled: false })
    changeLoading(false)
  }
}

const resetForm = () => {
  // 这里需要每次清空动态表单
  reactiveSchemas.splice(0, reactiveSchemas.length)
  reactiveSchemas.push(...baseSendSchemas)
  // 清除上一次的表单校验和参数
  resetFields()
  clearValidate()
}
</script>

<style scoped></style>
