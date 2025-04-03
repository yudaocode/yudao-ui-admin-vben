<script lang="ts" setup>
import type { SystemMailLogApi } from '#/api/system/mail/log';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

const formData = ref<SystemMailLogApi.MailLogVO>();
const getTitle = computed(() => {
  return '邮件日志详情';
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemMailLogApi.MailLogVO>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = data;
    } finally {
      modalApi.lock(false);
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <div class="p-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="form-item">
          <div class="form-label">编号：</div>
          <div>{{ formData?.id }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">创建时间：</div>
          <div>{{ formData?.createTime }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">收件邮箱：</div>
          <div>{{ formData?.toMail }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">发送邮箱：</div>
          <div>{{ formData?.fromMail }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">用户编号：</div>
          <div>{{ formData?.userId }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">用户类型：</div>
          <div>{{ formData?.userType }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">模板编号：</div>
          <div>{{ formData?.templateId }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">模板编码：</div>
          <div>{{ formData?.templateCode }}</div>
        </div>
      </div>

      <div class="mt-4">
        <div class="form-label">邮件标题：</div>
        <div>{{ formData?.templateTitle }}</div>
      </div>

      <div class="mt-4">
        <div class="form-label">邮件内容：</div>
        <div v-html="formData?.templateContent"></div>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="form-item">
          <div class="form-label">发送状态：</div>
          <div>{{ formData?.sendStatus }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">发送时间：</div>
          <div>{{ formData?.sendTime }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">发送消息编号：</div>
          <div>{{ formData?.sendMessageId }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">发送异常：</div>
          <div>{{ formData?.sendException }}</div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.form-item {
  @apply mb-2;
}

.form-label {
  @apply font-medium;
}
</style>
