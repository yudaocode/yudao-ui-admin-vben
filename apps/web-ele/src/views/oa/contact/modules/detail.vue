<script lang="ts" setup>
import type { OaContactApi } from '#/api/oa/contact';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElAvatar } from 'element-plus';

import { getContact } from '#/api/oa/contact';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const formData = ref<OaContactApi.Contact>(); // 联系人详情

const [Descriptions] = useDescription({
  border: true,
  column: 1,
  schema: useDetailSchema(),
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getContact(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="联系人详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions :data="formData">
      <template #name="{ data }">
        <div class="flex items-center gap-2">
          <ElAvatar :src="data?.avatar" :size="32" />
          <span>{{ data?.name }}</span>
        </div>
      </template>
    </Descriptions>
  </Modal>
</template>
