<script lang="ts" setup>
import type { MesWmProductIssueLineApi } from '#/api/mes/wm/productissue/line';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createProductIssueLine,
  getProductIssueLine,
  updateProductIssueLine,
} from '#/api/mes/wm/productissue/line';
import { $t } from '#/locales';

import { useLineFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmProductIssueLineApi.ProductIssueLine>();
const issueId = ref<number>(); // 所属领料单编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['领料出库单行'])
    : $t('ui.actionTitle.create', ['领料出库单行']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: useLineFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
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
      (await formApi.getValues()) as MesWmProductIssueLineApi.ProductIssueLine;
    data.issueId = issueId.value;
    try {
      await (formData.value?.id
        ? updateProductIssueLine({ ...data, id: formData.value.id })
        : createProductIssueLine(data));
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
    const data = modalApi.getData<{ id?: number; issueId: number }>();
    issueId.value = data.issueId;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getProductIssueLine(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
  </Modal>
</template>
