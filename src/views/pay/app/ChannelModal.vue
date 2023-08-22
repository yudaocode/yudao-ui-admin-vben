<script lang="ts" setup>
import { ref, unref } from 'vue'
import { aliPayFormSchema, mockFormSchema, weChatFormSchema } from './app.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { createChannel, getChannel, updateChannel } from '@/api/pay/channel'
import { PayType } from '@/enums/systemEnum'

defineOptions({ name: 'ChannelModal' })

const emit = defineEmits(['success', 'register'])
const { t } = useI18n()
const { createMessage } = useMessage()
const isUpdate = ref(true)
const appType = ref(PayType.ALIPAY)

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: appType.value === PayType.ALIPAY ? aliPayFormSchema : (appType.value === PayType.WECHAT ? weChatFormSchema : mockFormSchema),
  showActionButtonGroup: false,
  actionColOptions: { span: 23 },
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
  isUpdate.value = !!data?.isUpdate
  appType.value = data.type
  if (unref(isUpdate)) {
    const res = await getChannel(data.record.id, data.payCode)
    const config = JSON.parse(res.config)
    const payConfig: any = {}
    if (appType.value === PayType.ALIPAY) {
      payConfig.appId = config.appId
      payConfig.serverUrl = config.serverUrl
      payConfig.signType = config.signType
      payConfig.mode = config.mode
      payConfig.privateKey = config.privateKey
      payConfig.alipayPublicKey = config.alipayPublicKey
      payConfig.appCertContent = config.appCertContent
      payConfig.alipayPublicCertContent = config.alipayPublicCertContent
      payConfig.rootCertContent = config.rootCertContent
    }
    else if (appType.value === PayType.WECHAT) {
      payConfig.appId = config.appId
      payConfig.apiVersion = config.apiVersion
      payConfig.mchId = config.mchId
      payConfig.mchKey = config.mchKey
      payConfig.privateKeyContent = config.privateKeyContent
      payConfig.privateCertContent = config.privateCertContent
      payConfig.apiV3Key = config.apiV3Key
    }
    // else if (type.value === PayType.MOCK) {
    // }
    res.payConfig = payConfig
    delete res.config
    setFieldsValue({ ...res })
  }
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    values.config = JSON.stringify(values.payConfig)
    if (unref(isUpdate))
      await updateChannel(values)
    else
      await createChannel(values)

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
  <BasicModal v-bind="$attrs" :title="isUpdate ? t('action.edit') : t('action.create')" @register="registerModal" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
