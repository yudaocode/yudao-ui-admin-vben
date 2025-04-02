<script lang="ts" setup>
import type { SystemPostApi } from '#/api/system/post';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { computed, ref } from 'vue';
import { useVbenForm } from '#/adapter/form';
import { createPost, updatePost, getPost } from '#/api/system/post';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemPostApi.SystemPost>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['岗位'])
    : $t('ui.actionTitle.create', ['岗位']);
});

const [Form, formApi] = useVbenForm({
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
    const data = (await formApi.getValues()) as SystemPostApi.SystemPost;
    try {
      await (formData.value?.id ? updatePost(data) : createPost(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemPostApi.SystemPost>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getPost(data.id as number);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.lock(false);
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
