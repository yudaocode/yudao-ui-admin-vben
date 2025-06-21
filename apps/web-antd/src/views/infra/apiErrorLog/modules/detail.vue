<script lang="ts" setup>
import type { InfraApiErrorLogApi } from '#/api/infra/api-error-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const formData = ref<InfraApiErrorLogApi.ApiErrorLog>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<InfraApiErrorLogApi.ApiErrorLog>();
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
    title="API错误日志详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Description :data="formData" />
  </Modal>
</template>
