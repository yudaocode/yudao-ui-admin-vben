<script lang="ts" setup>
import type { SystemLoginLogApi } from '#/api/system/login-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { NDescriptions, NDescriptionsItem } from 'naive-ui';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

const formData = ref<SystemLoginLogApi.LoginLog>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemLoginLogApi.LoginLog>();
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
</script>

<template>
  <Modal
    title="登录日志详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <NDescriptions
      bordered
      :column="1"
      size="middle"
      class="mx-4"
      :label-style="{ width: '110px' }"
    >
      <NDescriptionsItem label="日志编号">
        {{ formData?.id }}
      </NDescriptionsItem>
      <NDescriptionsItem label="操作类型">
        <DictTag
          :type="DICT_TYPE.SYSTEM_LOGIN_TYPE"
          :value="formData?.logType"
        />
      </NDescriptionsItem>
      <NDescriptionsItem label="用户名称">
        {{ formData?.username }}
      </NDescriptionsItem>
      <NDescriptionsItem label="登录地址">
        {{ formData?.userIp }}
      </NDescriptionsItem>
      <NDescriptionsItem label="浏览器">
        {{ formData?.userAgent }}
      </NDescriptionsItem>
      <NDescriptionsItem label="登录结果">
        <DictTag
          :type="DICT_TYPE.SYSTEM_LOGIN_RESULT"
          :value="formData?.result"
        />
      </NDescriptionsItem>
      <NDescriptionsItem label="登录日期">
        {{ formatDateTime(formData?.createTime || '') }}
      </NDescriptionsItem>
    </NDescriptions>
  </Modal>
</template>
