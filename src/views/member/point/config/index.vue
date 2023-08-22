<script lang="ts" setup>
import { onMounted } from 'vue'
import { BasicForm, useForm } from '@/components/Form'
import type { FormSchema } from '@/components/From/src/types/form'
import { PageWrapper } from '@/components/Page'
import { getConfig, saveConfig } from '@/api/member/point/config'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'MemberPointConfig' })
const { t } = useI18n()
const { createMessage } = useMessage()

const formSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '积分抵扣',
    field: 'tradeDeductEnable',
    component: 'Switch',
    helpMessage: '下单积分是否抵用订单金额',
    colProps: { span: 8 },
  },
  {
    label: '积分抵扣',
    field: 'tradeDeductUnitPrice',
    required: true,
    helpMessage: '积分抵用比例(1 积分抵多少金额)，单位：元',
    component: 'InputNumber',
    componentProps: {
      precision: 2,
    },
  },
  {
    label: '积分抵扣最大值',
    field: 'tradeDeductMaxPrice',
    required: true,
    helpMessage: '单次下单积分使用上限，0 不限制',
    component: 'InputNumber',
    componentProps: {
      precision: 2,
    },
  },
  {
    label: '1 元赠送多少分',
    field: 'tradeGivePoint',
    required: true,
    helpMessage: '下单支付金额按比例赠送积分（实际支付 1 元赠送多少积分）',
    component: 'InputNumber',
    componentProps: {
      precision: 2,
    },
  },
]

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 140,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showResetButton: false,
  submitButtonOptions: { text: t('common.saveText') },
  actionColOptions: { span: 23 },
})

async function getConfigPage() {
  resetFields()
  const res = await getConfig()
  setFieldsValue({ ...res })
}

async function handleSubmit() {
  try {
    const values = await validate()
    await saveConfig(values)
  }
  finally {
    createMessage.success(t('common.saveSuccessText'))
  }
}

onMounted(async () => {
  await getConfigPage()
})
</script>

<template>
  <PageWrapper>
    <BasicForm class="w-200" @register="registerForm" @submit="handleSubmit" />
  </PageWrapper>
</template>
