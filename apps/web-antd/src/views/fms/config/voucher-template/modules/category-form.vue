<script lang="ts" setup>
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  createVoucherTemplateCategory,
  updateVoucherTemplateCategory,
} from '#/api/fms/config/voucher-template-category';
import { $t } from '#/locales';

import { useCategoryFormSchema } from '../data';

/** 弹窗数据 */
interface CategoryFormData {
  accountSetId: number; // 账套编号
  row?: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory; // 编辑的分类
}

const emit = defineEmits(['success']);
const formData = ref<CategoryFormData>();
const getTitle = computed(() =>
  formData.value?.row?.id
    ? $t('ui.actionTitle.edit', ['凭证模板分类'])
    : $t('ui.actionTitle.create', ['凭证模板分类']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
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
    const values = await formApi.getValues();
    const data: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory = {
      id: values.id,
      accountSetId: formData.value!.accountSetId,
      name: values.name,
    };
    try {
      await (formData.value?.row?.id
        ? updateVoucherTemplateCategory(data)
        : createVoucherTemplateCategory(data));
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
    formData.value = modalApi.getData<CategoryFormData>();
    await formApi.setValues({
      id: formData.value?.row?.id,
      name: formData.value?.row?.name ?? '',
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
