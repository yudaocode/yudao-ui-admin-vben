<script lang="ts" setup>
import type { HrmRecruitChannelApi } from '#/api/hrm/recruit/channel';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { Alert, message } from 'antdv-next';

import { deleteRecruitChannel } from '#/api/hrm/recruit/channel';
import { $t } from '#/locales';

import { useDeleteFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 92,
  },
  layout: 'horizontal',
  schema: useDeleteFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  confirmText: '确 定',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values = await formApi.getValues();
    if (!values.id || !values.transferChannelId) {
      return;
    }
    modalApi.lock();
    try {
      await deleteRecruitChannel({
        id: values.id,
        transferChannelId: values.transferChannelId,
      });
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.deleteSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<HrmRecruitChannelApi.RecruitChannel>();
    if (!data?.id) {
      return;
    }
    await formApi.setValues({
      id: data.id,
      channelName: data.name,
      transferChannelId: undefined,
    });
  },
});
</script>

<template>
  <Modal title="删除招聘渠道" class="w-[520px]">
    <Alert
      class="mb-5"
      show-icon
      type="warning"
      message="删除后，相关员工和候选人的招聘渠道将同步变更"
    />
    <Form class="mx-4" />
  </Modal>
</template>
