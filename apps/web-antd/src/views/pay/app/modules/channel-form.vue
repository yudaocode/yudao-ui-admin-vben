<script lang="ts" setup>
import type { PayChannelApi } from '#/api/pay/channel';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createChannel, getChannel, updateChannel } from '#/api/pay/channel';

import { channelSchema } from './data';

const emit = defineEmits(['success']);
const formData = ref<PayChannelApi.Channel>();
const formType = ref<string>('');
const title = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', '应用')
    : $t('ui.actionTitle.create', '应用');
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 160,
  },
  layout: 'horizontal',
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as PayChannelApi.Channel;
    try {
      await (formData.value?.id ? updateChannel(data) : createChannel(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const { id, payCode } = modalApi.getData() as {
      id?: number;
      payCode?: string;
    };
    if (!id || !payCode) {
      return;
    }
    modalApi.lock();
    if (payCode.includes('alipay_')) {
      formType.value = 'alipay';
    } else if (payCode.includes('mock')) {
      formType.value = 'mock';
    } else if (payCode.includes('wallet')) {
      formType.value = 'wallet';
    } else if (payCode.includes('wx')) {
      formType.value = 'wx';
    }

    try {
      formData.value = await getChannel(id, payCode);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>
<template>
  <Modal :close-on-click-modal="false" :title="title" class="w-[40%]">
    <Form :schema="channelSchema(formType)" />
  </Modal>
</template>
