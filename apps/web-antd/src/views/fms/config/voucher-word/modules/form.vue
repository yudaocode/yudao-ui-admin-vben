<script lang="ts" setup>
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  createVoucherWord,
  updateVoucherWord,
} from '#/api/fms/config/voucher-word';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const formData = ref<FmsVoucherWordApi.VoucherWord>();

const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['凭证字'])
    : $t('ui.actionTitle.create', ['凭证字']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 92,
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
    const values = await formApi.getValues();
    const data: FmsVoucherWordApi.VoucherWord = {
      id: values.id,
      accountSetId: values.accountSetId,
      name: values.name,
      printTitle: values.printTitle,
      defaultStatus: values.defaultStatus,
    };
    try {
      await (formData.value?.id
        ? updateVoucherWord(data)
        : createVoucherWord(data));
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
    const data = modalApi.getData<FmsVoucherWordApi.VoucherWord>();
    if (!data?.id) {
      // 新增时，打印标题默认“记账凭证”，是否默认为否
      await formApi.setValues({
        accountSetId: data?.accountSetId,
        name: '',
        printTitle: '记账凭证',
        defaultStatus: false,
      });
      return;
    }
    formData.value = data;
    await formApi.setValues(data);
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[480px]">
    <Form class="mx-4" />
  </Modal>
</template>
