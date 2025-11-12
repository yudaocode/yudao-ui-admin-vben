<script lang="ts" setup>
import type { NewsItem } from './types';

import { computed, provide, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message, Spin } from 'ant-design-vue';

import { createDraft, updateDraft } from '#/api/mp/draft';

import NewsForm from './news-form.vue';

const emit = defineEmits(['success']);

// DONE @hw：是不是通过 id 字段判断是否为新增？类似 /Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/system/user/modules/form.vue
const formData = ref<{
  accountId: number;
  mediaId?: string;
  newsList?: NewsItem[];
}>();
const newsList = ref<NewsItem[]>([]);
// DONE @hw：不需要 isSave，通过 modal 去 lock 就好啦。
const isSubmitting = ref(false);

const getTitle = computed(() => {
  return formData.value?.mediaId ? '修改图文' : '新建图文';
});

// 提供 accountId 给子组件
provide(
  'accountId',
  computed(() => formData.value?.accountId),
);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value) {
      return;
    }

    isSubmitting.value = true;
    modalApi.lock();
    try {
      if (formData.value.mediaId) {
        await updateDraft(
          formData.value.accountId,
          formData.value.mediaId,
          newsList.value,
        );
        message.success('更新成功');
      } else {
        await createDraft(formData.value.accountId, newsList.value);
        message.success('新增成功');
      }
      await modalApi.close();
      emit('success');
    } finally {
      isSubmitting.value = false;
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      newsList.value = [];
      return;
    }
    const data = modalApi.getData<{
      accountId: number;
      isCreating: boolean;
      mediaId?: string;
      newsList?: NewsItem[];
    }>();
    if (!data) {
      return;
    }
    formData.value = {
      accountId: data.accountId,
      mediaId: data.mediaId,
      newsList: data.newsList,
    };
    newsList.value = data.newsList || [];
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-4/5" destroy-on-close>
    <Spin :spinning="isSubmitting">
      <NewsForm
        v-if="formData"
        v-model="newsList"
        :is-creating="!formData.mediaId"
      />
    </Spin>
  </Modal>
</template>
