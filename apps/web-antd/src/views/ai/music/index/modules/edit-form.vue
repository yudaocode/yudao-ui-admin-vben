<script lang="ts" setup>
import type { AiMusicApi } from '#/api/ai/music';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { updateMyMusic } from '#/api/ai/music';
import { $t } from '#/locales';

import { useEditFormSchema } from '../data';

/** AI 音乐：修改名称与封面 */
defineOptions({ name: 'AiMusicEditForm' });

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: useEditFormSchema(),
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
    const values = await formApi.getValues();
    try {
      await updateMyMusic({
        id: values.id,
        title: (values.title || '').trim(),
        coverUrl: values.coverUrl,
      });
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
      return;
    }
    // 设置到 values
    const data = modalApi.getData() as AiMusicApi.Music;
    if (!data?.id) {
      return;
    }
    await formApi.setValues({
      id: data.id,
      title: data.title || '',
      coverUrl: data.coverUrl || '',
    });
  },
});
</script>

<template>
  <Modal title="修改歌曲" class="w-[500px]">
    <Form class="mx-4" />
  </Modal>
</template>
