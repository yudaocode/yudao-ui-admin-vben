<script lang="ts" setup>
import type { MesProAndonConfigApi } from '#/api/mes/pro/andon/config';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createAndonConfig,
  getAndonConfig,
  updateAndonConfig,
} from '#/api/mes/pro/andon/config';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesProAndonConfigApi.AndonConfig>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['安灯配置'])
    : $t('ui.actionTitle.create', ['安灯配置']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
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
    const data =
      (await formApi.getValues()) as MesProAndonConfigApi.AndonConfig;
    if (!data.handlerRoleId && !data.handlerUserId) {
      message.warning('处置角色和处置人至少填一个');
      modalApi.unlock();
      return;
    }
    try {
      await (formData.value?.id
        ? updateAndonConfig(data)
        : createAndonConfig(data));
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
    const data = modalApi.getData<MesProAndonConfigApi.AndonConfig>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getAndonConfig(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4" />
  </Modal>
</template>
