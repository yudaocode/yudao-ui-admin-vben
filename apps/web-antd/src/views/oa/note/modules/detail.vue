<script lang="ts" setup>
import type { OaNoteApi } from '#/api/oa/note';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { getNote } from '#/api/oa/note';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const formData = ref<OaNoteApi.Note>(); // 笔记详情

const [Descriptions] = useDescription({
  bordered: true,
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
      // 查询详情，由后端校验当前用户是否有权访问
      formData.value = await getNote(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="笔记详情"
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
      <template #fileUrls="{ data }">
        <template v-if="data?.fileUrls?.length">
          <a
            v-for="(url, index) in data.fileUrls"
            :key="url"
            class="mr-2.5 text-primary"
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
          >
            附件 {{ (index as number) + 1 }}
          </a>
        </template>
        <span v-else>-</span>
      </template>
    </Descriptions>
  </Modal>
</template>
