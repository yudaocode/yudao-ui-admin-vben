<script lang="ts" setup>
import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { updateRecruitPostStatus } from '#/api/hrm/recruit/post';
import { $t } from '#/locales';
import { HrmRecruitPostStatus } from '#/views/hrm/utils/constants';

import { useStopFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: useStopFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values = await formApi.getValues();
    const stopReason = String(values.stopReason ?? '').trim();
    if (!stopReason) {
      message.warning('停止原因不能为空');
      return;
    }
    if (stopReason.length > 255) {
      message.warning('停止原因不能超过 255 个字符');
      return;
    }
    const data = modalApi.getData<{ id: number }>();
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      await updateRecruitPostStatus({
        id: data.id,
        status: HrmRecruitPostStatus.STOPPED,
        stopReason,
      });
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
    await formApi.setValues({ stopReason: '' });
  },
});
</script>

<template>
  <Modal title="停止招聘" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
