<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="isUpdate ? t('action.edit') : t('action.create')" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup>
import { ref, unref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { aliPayFormSchema, weChatFormSchema } from './app.data'
import { createChannel, updateChannel, getChannel } from '@/api/pay/channel'
import { PayType } from '@/enums/systemEnum'

defineOptions({ name: 'ChannelModal' })

const { t } = useI18n()
const { createMessage } = useMessage()
const emit = defineEmits(['success', 'register'])
const isUpdate = ref(true)
const type = ref(PayType.ALIPAY)

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: type.value === PayType.ALIPAY ? aliPayFormSchema : weChatFormSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
  isUpdate.value = !!data?.isUpdate
  type.value = data.type
  if (unref(isUpdate)) {
    let res = await getChannel(data.record.payMerchant.id, data.record.id, data.payCode)
    const config = JSON.parse(res.config)
    const payConfig: any = {}
    if (type.value === PayType.ALIPAY) {
      payConfig.appId = config.appId
      payConfig.serverUrl = config.serverUrl
      payConfig.signType = config.signType
      payConfig.mode = config.mode
      payConfig.privateKey = config.privateKey
      payConfig.alipayPublicKey = config.alipayPublicKey
      payConfig.appCertContent = config.appCertContent
      payConfig.alipayPublicCertContent = config.alipayPublicCertContent
      payConfig.rootCertContent = config.rootCertContent
    } else {
      payConfig.appId = config.appId
      payConfig.apiVersion = config.apiVersion
      payConfig.mchId = config.mchId
      payConfig.mchKey = config.mchKey
      payConfig.privateKeyContent = config.privateKeyContent
      payConfig.privateCertContent = config.privateCertContent
      payConfig.apiV3Key = config.apiV3Key
    }
    res.payConfig = payConfig
    delete res['config']
    setFieldsValue({ ...res })
  }
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    values.config = JSON.stringify(values.payConfig)
    if (unref(isUpdate)) {
      await updateChannel(values)
    } else {
      await createChannel(values)
    }
    closeModal()
    emit('success')
    createMessage.success(t('common.saveSuccessText'))
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
