<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { baseSendSchemas } from './smsTemplate.data'
import { BasicModal, useModalInner } from '@/components/Modal'
import type { FormSchema } from '@/components/Form'
import { BasicForm, useForm } from '@/components/Form'
import type { SmsTemplateVO } from '@/api/system/sms/smsTemplate'
import { sendSms } from '@/api/system/sms/smsTemplate'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'SendSmsModal' })

const { createMessage } = useMessage()
const reactiveSchemas: FormSchema[] = reactive([])
const templateCode = ref<string>('')

const [register, { setFieldsValue, getFieldsValue, validateFields, resetFields, clearValidate, setProps }] = useForm({
  labelWidth: 100,
  baseColProps: {
    span: 24,
  },
  showActionButtonGroup: false,
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
        placeholder: `输入{${item}}`,
      },
      required: true,
    }
    reactiveSchemas.push(dySchema)
  })
  const { content, code } = data
  setFieldsValue({ content })
  templateCode.value = code
})

async function submit() {
  try {
    setProps({ disabled: true })
    changeLoading(true)
    await validateFields()
    const fields = getFieldsValue()
    const data = {
      mobile: fields.mobile,
      templateCode: templateCode.value,
      templateParams: {},
    }
    Object.keys(fields).forEach((key) => {
      if (key === 'content' || key === 'mobile')
        return

      // 去掉 - 后的key
      const realKey = key.split('-')[1]
      data.templateParams[realKey] = fields[key]
    })
    await sendSms(data)
    createMessage.success(`发送短信到[${fields.mobile}]成功`)
    closeModal()
  }
  finally {
    setProps({ disabled: false })
    changeLoading(false)
  }
}

function resetForm() {
  // 这里需要每次清空动态表单
  reactiveSchemas.splice(0, reactiveSchemas.length)
  reactiveSchemas.push(...baseSendSchemas)
  // 清除上一次的表单校验和参数
  resetFields()
  clearValidate()
}
</script>

<template>
  <BasicModal v-bind="$attrs" title="测试发送短信" @register="innerRegister" @ok="submit">
    <BasicForm :schemas="reactiveSchemas" @register="register" />
  </BasicModal>
</template>
