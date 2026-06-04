<script lang="ts" setup>
import type { MesProProcessContentApi } from '#/api/mes/pro/process/content';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createProcessContent,
  getProcessContent,
  updateProcessContent,
} from '#/api/mes/pro/process/content';
import { $t } from '#/locales';

import { useContentFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesProProcessContentApi.ProcessContent>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['工序步骤'])
    : $t('ui.actionTitle.create', ['工序步骤']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: useContentFormSchema(),
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
      (await formApi.getValues()) as MesProProcessContentApi.ProcessContent;
    try {
      await (formData.value?.id
        ? updateProcessContent(data)
        : createProcessContent(data));
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
    const data = modalApi.getData<{
      id?: number;
      maxSort?: number;
      processId: number;
    }>();
    if (!data?.id) {
      // 新增时，默认序号 = maxSort + 1
      await formApi.setValues({
        processId: data?.processId,
        sort: (data?.maxSort || 0) + 1,
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getProcessContent(data.id);
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
