<script lang="ts" setup>
import type { MesQcTemplateIndicatorApi } from '#/api/mes/qc/template/indicator';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createTemplateIndicator,
  getTemplateIndicator,
  updateTemplateIndicator,
} from '#/api/mes/qc/template/indicator';
import { $t } from '#/locales';

import { useIndicatorFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesQcTemplateIndicatorApi.TemplateIndicator>();
const templateId = ref<number>(); // 当前所属质检方案编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['指标项'])
    : $t('ui.actionTitle.create', ['指标项']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useIndicatorFormSchema(),
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
      (await formApi.getValues()) as MesQcTemplateIndicatorApi.TemplateIndicator;
    data.templateId = templateId.value;
    try {
      await (formData.value?.id
        ? updateTemplateIndicator(data)
        : createTemplateIndicator(data));
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
    const data = modalApi.getData<
      MesQcTemplateIndicatorApi.TemplateIndicator & { templateId: number }
    >();
    templateId.value = data.templateId;
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getTemplateIndicator(data.id);
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
