<script lang="ts" setup>
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { useVbenModal } from '@vben/common-ui';

import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const [Description, descApi] = useDescription({
  componentProps: {
    bordered: true,
    column: 1,
    size: 'middle',
    class: 'mx-4',
  },
  schema: useDetailSchema(),
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemNotifyMessageApi.NotifyMessage>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      descApi.setState({ data });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="消息详情"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Description />
  </Modal>
</template>
