<script lang="ts" setup>
import type { FmsCurrencyApi } from '#/api/fms/config/currency';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  createCurrency,
  updateCurrency,
} from '#/api/fms/config/currency';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<FmsCurrencyApi.Currency>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['币别'])
    : $t('ui.actionTitle.create', ['币别']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useFormSchema(() => !!formData.value?.standard),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const values = await formApi.getValues();
    const data: FmsCurrencyApi.Currency = {
      id: values.id,
      accountSetId: values.accountSetId,
      code: values.code.toUpperCase(),
      name: values.name,
      exchangeRate: values.exchangeRate,
      standard: values.standard,
    };
    try {
      await (formData.value?.id
        ? updateCurrency(data)
        : createCurrency(data));
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
    const data = modalApi.getData<FmsCurrencyApi.Currency>();
    if (!data?.id) {
      await formApi.setValues({
        accountSetId: data?.accountSetId,
        code: '',
        name: '',
        exchangeRate: 1,
        standard: false,
      });
      return;
    }
    formData.value = data;
    await formApi.setValues(data);
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
