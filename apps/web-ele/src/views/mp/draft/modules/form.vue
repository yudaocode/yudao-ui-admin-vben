<script lang="ts" setup>
import type { NewsItem } from './types';

import { computed, provide, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage, ElMessageBox } from 'element-plus';

import * as MpDraftApi from '#/api/mp/draft';

import NewsForm from './news-form.vue';

const emit = defineEmits(['success']);

const formData = ref<{
  accountId: number;
  isCreating: boolean;
  mediaId?: string;
  newsList?: NewsItem[];
}>();
const newsList = ref<NewsItem[]>([]);
const isSubmitting = ref(false);
const isSaved = ref(false);

const getTitle = computed(() => {
  return formData.value?.isCreating ? '新建图文' : '修改图文';
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
      if (formData.value.isCreating) {
        await MpDraftApi.createDraft(formData.value.accountId, newsList.value);
        ElMessage.success('新增成功');
      } else if (formData.value.mediaId) {
        await MpDraftApi.updateDraft(
          formData.value.accountId,
          formData.value.mediaId,
          newsList.value,
        );
        ElMessage.success('更新成功');
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
      await ElMessageBox.confirm('修改内容可能还未保存，确定关闭吗?');
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
    <NewsForm
      v-if="formData"
      v-model="newsList"
      v-loading="isSubmitting"
      :is-creating="formData.isCreating"
    />
  </Modal>
</template>
