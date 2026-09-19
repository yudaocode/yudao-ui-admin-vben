<script lang="ts" setup>
import type { OaMailAccountApi } from '#/api/oa/mail/account';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createMailAccount,
  getMailAccount,
  updateMailAccount,
} from '#/api/oa/mail/account';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaMailAccountApi.MailAccount>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['邮箱账号'])
    : $t('ui.actionTitle.create', ['邮箱账号']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 邮箱失焦后补充默认登录名 */
async function handleMailBlur() {
  const { mail, username } = await formApi.getValues();
  if (!username) {
    formApi.setFieldValue('username', mail);
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as OaMailAccountApi.MailAccount;
    try {
      await (formData.value?.id
        ? updateMailAccount(data)
        : createMailAccount(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as OaMailAccountApi.MailAccount;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      // 修改时，设置数据；密码不回显
      formData.value = { ...(await getMailAccount(data.id)), password: '' };
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/3">
    <Form class="mx-4">
      <!-- 邮箱地址：失焦后补充默认登录名 -->
      <template #mail="slotProps">
        <Input v-bind="slotProps.componentProps" @blur="handleMailBlur" />
      </template>
    </Form>
  </Modal>
</template>
