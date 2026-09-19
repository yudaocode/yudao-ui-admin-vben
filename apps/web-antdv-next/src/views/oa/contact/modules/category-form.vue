<script lang="ts" setup>
import type { OaContactCategoryApi } from '#/api/oa/contact/category';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createContactCategory,
  getContactCategory,
  updateContactCategory,
} from '#/api/oa/contact/category';
import { $t } from '#/locales';

import { useCategoryFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaContactCategoryApi.ContactCategory>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['联系人分类'])
    : $t('ui.actionTitle.create', ['联系人分类']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useCategoryFormSchema(),
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
    const data =
      (await formApi.getValues()) as OaContactCategoryApi.ContactCategory;
    try {
      await (formData.value?.id
        ? updateContactCategory(data)
        : createContactCategory(data));
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
    const data = modalApi.getData() as OaContactCategoryApi.ContactCategory;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getContactCategory(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[480px]">
    <Form class="mx-4" />
  </Modal>
</template>
