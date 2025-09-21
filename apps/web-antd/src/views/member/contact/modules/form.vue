<script lang="ts" setup>
import type { ContactApi } from '#/api/member/contact';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createContact, getContact, updateContact } from '#/api/member/contact';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<ContactApi.Contact>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['联系人'])
    : $t('ui.actionTitle.create', ['联系人']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
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
    const data = (await formApi.getValues()) as ContactApi.Contact;
    try {
      await (formData.value?.id ? updateContact(data) : createContact(data));
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
    let data = modalApi.getData<ContactApi.Contact>();
    if (!data) {
      return;
    }
    if (data.id) {
      modalApi.lock();
      try {
        data = await getContact(data.id);
      } finally {
        modalApi.unlock();
      }
    }
    // 设置到 values
    formData.value = data;
    await formApi.setValues(formData.value);
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
