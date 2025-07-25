<script lang="ts" setup>
import type { MallDiyTemplateApi } from '#/api/mall/promotion/diy/template';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  createDiyTemplate,
  getDiyTemplate,
  updateDiyTemplate,
} from '#/api/mall/promotion/diy/template';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

/** 提交表单 */
const emit = defineEmits(['success']);

const formData = ref<MallDiyTemplateApi.DiyTemplate>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['装修模板'])
    : $t('ui.actionTitle.create', ['装修模板']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
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
    const data = (await formApi.getValues()) as MallDiyTemplateApi.DiyTemplate;

    // 确保必要的默认值
    if (!data.previewPicUrls) {
      data.previewPicUrls = [];
    }
    if (data.used === undefined) {
      data.used = false;
    }

    try {
      await (formData.value?.id
        ? updateDiyTemplate(data)
        : createDiyTemplate(data));
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
    const data = modalApi.getData<MallDiyTemplateApi.DiyTemplate>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getDiyTemplate(data.id as number);
      // 设置到 values
      if (formData.value) {
        await formApi.setValues(formData.value);
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-2/5" :title="getTitle">
    <Form />
  </Modal>
</template>
