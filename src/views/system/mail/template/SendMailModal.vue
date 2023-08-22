<script lang="ts" setup>
import { baseSendSchemas, keyPrefix } from './template.data'
import { BasicModal, useModalInner } from '@/components/Modal'
import type { FormSchema } from '@/components/Form'
import { BasicForm, useForm } from '@/components/Form'
import { sendMail } from '@/api/system/mail/template'
import type { MailTemplate } from '@/api/system/mail/template'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'SendMailModal' })

const [register, { setFieldsValue, getFieldsValue, validateFields, resetFields, clearValidate, appendSchemaByField, removeSchemaByField }]
  = useForm({
    labelWidth: 120,
    schemas: baseSendSchemas,
    baseColProps: {
      span: 24,
    },
    showActionButtonGroup: false,
  })

// 存储动态生成的字段信息 后续需要进行移除
let dyFields: string[] = []

const [innerRegister, { changeLoading, changeOkLoading, closeModal }] = useModalInner(async (data: MailTemplate) => {
  // 打开时进行清空
  await resetForm()
  const dyschemas: FormSchema[] = []
  data.params.forEach((item) => {
    // 这里加上前缀 防止和content/mail字段重名
    const field = keyPrefix + item
    const dySchema: FormSchema = {
      field,
      label: `参数{${item}} `,
      component: 'Input',
      componentProps: {
        placeholder: `输入{${item}}`,
      },
      required: true,
    }
    dyschemas.push(dySchema)
    dyFields.push(field)
  })
  setFieldsValue(data)
  // 添加动态参数到末尾
  appendSchemaByField(dyschemas, undefined)
})

function modalLoading(status: boolean) {
  changeOkLoading(status)
  changeLoading(status)
}

/**
 * 移除动态生成的表单元素
 */
async function removeDySchemas() {
  await removeSchemaByField(dyFields)
  dyFields = []
}

const { createMessage } = useMessage()
async function submit() {
  try {
    modalLoading(true)
    await validateFields()
    const fields = getFieldsValue()
    const data = {
      mail: fields.mail,
      templateCode: fields.code,
      templateParams: {},
    }
    Object.keys(fields).forEach((key) => {
      // 这几个是固定的字段 不用处理
      const fixedKeys = ['mail', 'code', 'content']
      if (fixedKeys.includes(key))
        return

      // 去掉前缀后的key
      const realKey = key.split(keyPrefix)[1]
      data.templateParams[realKey] = fields[key]
    })
    await sendMail(data)
    createMessage.success(`发送邮件到[${fields.mail}]成功`)
    closeModal()
  }
  catch (e) {
  }
  finally {
    modalLoading(false)
  }
}

async function resetForm() {
  // 这里需要清空动态表单
  await removeDySchemas()
  // 清除上一次的表单校验和参数
  await resetFields()
  await clearValidate()
}
</script>

<template>
  <BasicModal v-bind="$attrs" title="发送邮件" width="600px" @register="innerRegister" @ok="submit" @cancel="resetForm">
    <BasicForm @register="register" />
  </BasicModal>
</template>
