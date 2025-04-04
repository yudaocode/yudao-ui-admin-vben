<script lang="ts" setup>
import type { SystemMailAccountApi } from '#/api/system/mail/account';

import { useVbenModal } from '@vben/common-ui';

import { $t } from '#/locales';
import { computed, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import { createMailAccount, getMailAccount, updateMailAccount,} from '#/api/system/mail/account';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemMailAccountApi.SystemMailAccount>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['邮箱账号'])
    : $t('ui.actionTitle.create', ['邮箱账号']);
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  commonConfig: {
    labelWidth: 140
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
    const data = (await formApi.getValues()) as SystemMailAccountApi.SystemMailAccount;
    try {
      await (formData.value?.id ? updateMailAccount(data) : createMailAccount(data));
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
    const data = modalApi.getData<SystemMailAccountApi.SystemMailAccount>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getMailAccount(data.id);
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
