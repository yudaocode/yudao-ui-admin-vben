<script lang="ts" setup>
import type { OaAnnouncementApi } from '#/api/oa/announcement';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElLink } from 'element-plus';

import {
  getAnnouncement,
  updateAnnouncementReadStatus,
} from '#/api/oa/announcement';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const emit = defineEmits(['read']);

const formData = ref<OaAnnouncementApi.Announcement>(); // 公告详情

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
    const data = modalApi.getData() as { id: number; markAsRead?: boolean };
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getAnnouncement(data.id);
      // 接收人阅读未读公告时，同步阅读状态
      if (data.markAsRead && !formData.value.readStatus) {
        await updateAnnouncementReadStatus(data.id);
        formData.value.readStatus = true;
        emit('read', data.id);
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="公告详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions :data="formData">
      <template #content="{ data }">
        <div
          class="min-h-[120px] break-words [&_img]:max-w-full [&_p]:my-2"
          v-dompurify-html="data?.content || ''"
        ></div>
      </template>
      <template #url="{ data }">
        <ElLink
          v-if="data?.url"
          type="primary"
          :href="data.url"
          target="_blank"
        >
          打开链接
        </ElLink>
        <span v-else>-</span>
      </template>
    </Descriptions>
  </Modal>
</template>
