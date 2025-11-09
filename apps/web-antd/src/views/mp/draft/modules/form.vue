<script lang="ts" setup>
import type { NewsItem } from '../components/types';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';

import { message, Spin } from 'ant-design-vue';

import { createDraft, updateDraft } from '#/api/mp/draft';

import NewsForm from '../components/news-form.vue';

const emit = defineEmits(['success']);

const formData = ref<{
  accountId: number;
  // TODO @hw：是不是通过 id 字段判断是否为新增？类似 /Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/system/user/modules/form.vue
  isCreating: boolean;
  mediaId?: string;
  newsList?: NewsItem[];
}>();
const newsList = ref<NewsItem[]>([]);
// TODO @hw：不需要 isSave，通过 modal 去 lock 就好啦。
const isSubmitting = ref(false);
// TODO @hw：不需要 isSave，通过 modal 去 lock 就好啦。
const isSaved = ref(false);

const getTitle = computed(() => {
  return formData.value?.isCreating ? '新建图文' : '修改图文';
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value) {
      return;
    }

    isSubmitting.value = true;
    modalApi.lock();
    try {
      if (formData.value.isCreating) {
        await createDraft(formData.value.accountId, newsList.value);
        message.success('新增成功');
      } else if (formData.value.mediaId) {
        await updateDraft(
          formData.value.accountId,
          formData.value.mediaId,
          newsList.value,
        );
        message.success('更新成功');
      }
      isSaved.value = true;
      await modalApi.close();
      emit('success');
    } finally {
      isSubmitting.value = false;
      modalApi.unlock();
    }
  },
  async onBeforeClose() {
    // 如果已经成功保存，直接关闭，不显示提示
    if (isSaved.value) {
      return true;
    }
    try {
      await confirm('修改内容可能还未保存，确定关闭吗?');
      return true;
    } catch {
      return false;
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      newsList.value = [];
      isSaved.value = false;
      return;
    }
    isSaved.value = false;
    const data = modalApi.getData<{
      accountId: number;
      isCreating: boolean;
      mediaId?: string;
      newsList?: NewsItem[];
    }>();
    if (!data) {
      return;
    }
    formData.value = data;
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
        :is-creating="formData.isCreating"
      />
    </Spin>
  </Modal>
</template>
