<script lang="ts" setup>
import type { SystemSmsLogApi } from 'src/api/system/sms/log';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

const formData = ref<SystemSmsLogApi.SmsLogVO>();
const getTitle = computed(() => {
  return '短信日志详情';
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemSmsLogApi.SmsLogVO>();
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
          <div class="form-label">手机号：</div>
          <div>{{ formData?.mobile }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">短信渠道：</div>
          <div>{{ formData?.channelCode }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">模板编号：</div>
          <div>{{ formData?.templateId }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">模板类型：</div>
          <div>{{ formData?.templateType }}</div>
        </div>
      </div>

      <div class="mt-4">
        <div class="form-label">短信内容：</div>
        <div>{{ formData?.templateContent }}</div>
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
          <div class="form-label">API发送编码：</div>
          <div>{{ formData?.apiSendCode }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">API发送消息：</div>
          <div>{{ formData?.apiSendMsg }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">接收状态：</div>
          <div>{{ formData?.receiveStatus }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">接收时间：</div>
          <div>{{ formData?.receiveTime }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">API接收编码：</div>
          <div>{{ formData?.apiReceiveCode }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">API接收消息：</div>
          <div>{{ formData?.apiReceiveMsg }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">API请求ID：</div>
          <div>{{ formData?.apiRequestId }}</div>
        </div>
        <div class="form-item">
          <div class="form-label">API序列号：</div>
          <div>{{ formData?.apiSerialNo }}</div>
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
