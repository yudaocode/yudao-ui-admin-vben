<script lang="ts" setup>
import type { InfraApiAccessLogApi } from '#/api/infra/api-access-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const formData = ref<InfraApiAccessLogApi.ApiAccessLog>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<InfraApiAccessLogApi.ApiAccessLog>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = data;
    } finally {
      modalApi.unlock();
    }
  },
});

const [Description] = useDescription({
  componentProps: {
    bordered: true,
    column: 1,
    class: 'mx-4',
  },
  schema: useDetailSchema(),
});
</script>

<template>
  <Modal
    title="API 访问日志详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Description :data="formData" />
  </Modal>
</template>
