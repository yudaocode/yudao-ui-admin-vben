<script lang="ts" setup>
import type { SystemNotifyTemplateApi } from '#/api/system/notify/template';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { $t } from '#/locales';
import { computed, ref } from 'vue';
import { useVbenForm } from '#/adapter/form';
import {
  createNotifyTemplate,
  getNotifyTemplate,
  updateNotifyTemplate,
} from '#/api/system/notify/template';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemNotifyTemplateApi.NotifyTemplate>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['站内信模板'])
    : $t('ui.actionTitle.create', ['站内信模板']);
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  commonConfig: {
    labelWidth: 120,
  },
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as SystemNotifyTemplateApi.NotifyTemplate;
    try {
      await (formData.value?.id
        ? updateNotifyTemplate(data)
        : createNotifyTemplate(data));
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
    const data = modalApi.getData<SystemNotifyTemplateApi.NotifyTemplate>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getNotifyTemplate(data.id as number);
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
