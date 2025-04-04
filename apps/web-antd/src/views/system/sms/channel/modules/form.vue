<script lang="ts" setup>
import type { SystemSmsChannelApi } from '#/api/system/sms/channel';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { $t } from '#/locales';
import { computed, ref } from 'vue';
import { useVbenForm } from '#/adapter/form';
import { getSmsChannel, createSmsChannel, updateSmsChannel } from '#/api/system/sms/channel';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemSmsChannelApi.SystemSmsChannel>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['短信渠道'])
    : $t('ui.actionTitle.create', ['短信渠道']);
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  commonConfig: {
    labelWidth: 120
  }
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as SystemSmsChannelApi.SystemSmsChannel;
    try {
      await (formData.value?.id ? updateSmsChannel(data) : createSmsChannel(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemSmsChannelApi.SystemSmsChannel>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSmsChannel(data.id as number);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.lock(false);
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
