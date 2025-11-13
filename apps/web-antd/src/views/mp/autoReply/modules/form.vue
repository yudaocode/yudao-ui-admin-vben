<script lang="ts" setup>
import type { Reply } from '#/views/mp/components/wx-reply';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { createAutoReply, updateAutoReply } from '#/api/mp/autoReply';
import { $t } from '#/locales';
import { ReplyType } from '#/views/mp/components/wx-reply/types';

import ReplyForm from '../components/ReplyForm.vue';
import { MsgType } from '../components/types';

const emit = defineEmits(['success']);

const formRef = ref<InstanceType<typeof ReplyForm> | null>(null);

const formData = ref<{ isCreating: boolean; msgType: MsgType; row?: any }>();
const replyForm = ref<any>({});
const reply = ref<Reply>({
  type: ReplyType.Text,
  accountId: -1,
});
const getTitle = computed(() => {
  return formData.value?.isCreating
    ? $t('ui.actionTitle.create', ['自动回复'])
    : $t('ui.actionTitle.edit', ['自动回复']);
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();

    // 处理回复消息
    const submitForm: any = { ...replyForm.value };
    submitForm.responseMessageType = reply.value.type;
    submitForm.responseContent = reply.value.content;
    submitForm.responseMediaId = reply.value.mediaId;
    submitForm.responseMediaUrl = reply.value.url;
    submitForm.responseTitle = reply.value.title;
    submitForm.responseDescription = reply.value.description;
    submitForm.responseThumbMediaId = reply.value.thumbMediaId;
    submitForm.responseThumbMediaUrl = reply.value.thumbMediaUrl;
    submitForm.responseArticles = reply.value.articles;
    submitForm.responseMusicUrl = reply.value.musicUrl;
    submitForm.responseHqMusicUrl = reply.value.hqMusicUrl;

    modalApi.lock();
    try {
      if (replyForm.value.id === undefined) {
        await createAutoReply(submitForm);
        message.success('新增成功');
      } else {
        await updateAutoReply(submitForm);
        message.success('修改成功');
      }
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      replyForm.value = {};
      reply.value = {
        type: ReplyType.Text,
        accountId: -1,
      };
      return;
    }
    // 加载数据
    const data = modalApi.getData<{
      accountId?: number;
      isCreating: boolean;
      msgType: MsgType;
      row?: any;
    }>();
    if (!data) {
      return;
    }
    formData.value = data;

    if (data.isCreating) {
      // 新建：初始化表单
      replyForm.value = {
        id: undefined,
        accountId: data.accountId || -1,
        type: data.msgType,
        requestKeyword: undefined,
        requestMatch: data.msgType === MsgType.Keyword ? 1 : undefined,
        requestMessageType: undefined,
      };
      reply.value = {
        type: ReplyType.Text,
        accountId: data.accountId || -1,
      };
    } else if (data.row) {
      // 编辑：加载数据
      const rowData = data.row;
      replyForm.value = { ...rowData };
      delete replyForm.value.responseMessageType;
      delete replyForm.value.responseContent;
      delete replyForm.value.responseMediaId;
      delete replyForm.value.responseMediaUrl;
      delete replyForm.value.responseDescription;
      delete replyForm.value.responseArticles;
      reply.value = {
        type: rowData.responseMessageType,
        accountId: data.accountId || -1,
        content: rowData.responseContent,
        mediaId: rowData.responseMediaId,
        url: rowData.responseMediaUrl,
        title: rowData.responseTitle,
        description: rowData.responseDescription,
        thumbMediaId: rowData.responseThumbMediaId,
        thumbMediaUrl: rowData.responseThumbMediaUrl,
        articles: rowData.responseArticles,
        musicUrl: rowData.responseMusicUrl,
        hqMusicUrl: rowData.responseHqMusicUrl,
      };
    }
  },
});
</script>

<template>
  <!-- TODO @hw：可以使用 <Form class="mx-4" /> 这种组件形式么？ -->
  <Modal :title="getTitle" class="w-4/5">
    <ReplyForm
      v-if="formData"
      v-model="replyForm"
      v-model:reply="reply"
      :msg-type="formData.msgType"
      ref="formRef"
    />
  </Modal>
</template>
