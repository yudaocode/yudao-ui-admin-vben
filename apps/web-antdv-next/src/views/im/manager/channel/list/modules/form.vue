<script lang="ts" setup>
import type { ImManagerChannelApi } from '#/api/im/manager/channel'

import { computed, ref } from 'vue'

import { useVbenModal } from '@vben/common-ui'

import { message } from 'antdv-next'

import { useVbenForm } from '#/adapter/form'
import {
  createManagerChannel,
  getManagerChannel,
  updateManagerChannel
} from '#/api/im/manager/channel'
import { $t } from '#/locales'

import { useFormSchema } from '../data'

const emit = defineEmits(['success'])
const formData = ref<ImManagerChannelApi.Channel>()
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['频道'])
    : $t('ui.actionTitle.create', ['频道'])
})

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full'
    },
    formItemClass: 'col-span-2',
    labelWidth: 100
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false
})

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate()
    if (!valid) {
      return
    }
    modalApi.lock()
    const data = (await formApi.getValues()) as ImManagerChannelApi.Channel
    try {
      await (formData.value?.id ? updateManagerChannel(data) : createManagerChannel(data))
      await modalApi.close()
      emit('success')
      message.success($t('ui.actionMessage.operationSuccess'))
    } finally {
      modalApi.unlock()
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined
      return
    }
    const data = modalApi.getData<ImManagerChannelApi.Channel>()
    if (!data || !data.id) {
      return
    }
    modalApi.lock()
    try {
      formData.value = await getManagerChannel(data.id)
      await formApi.setValues(formData.value)
    } finally {
      modalApi.unlock()
    }
  }
})
</script>

<template>
  <Modal :title="getTitle" class="w-1/3">
    <Form class="mx-4" />
  </Modal>
</template>
