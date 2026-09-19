<script lang="ts" setup>
import type { OaContactApi } from '#/api/oa/contact';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createContact, getContact, updateContact } from '#/api/oa/contact';
import { getSimpleContactCategoryList } from '#/api/oa/contact/category';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaContactApi.Contact>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['外部联系人'])
    : $t('ui.actionTitle.create', ['外部联系人']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  wrapperClass: 'grid-cols-2',
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
    const data = (await formApi.getValues()) as OaContactApi.Contact;
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
    modalApi.lock();
    try {
      // 加载分类选项
      const categories = await getSimpleContactCategoryList();
      formApi.updateSchema([
        {
          fieldName: 'categoryId',
          componentProps: {
            options: categories.map((item) => ({
              label: item.name,
              value: item.id,
            })),
          },
        },
      ]);
      // 修改时，加载联系人数据
      const data = modalApi.getData() as OaContactApi.Contact;
      if (!data || !data.id) {
        return;
      }
      formData.value = await getContact(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/3">
    <Form class="mx-4" />
  </Modal>
</template>
