<script lang="ts" setup>
import type { SystemLoginLogApi } from '#/api/system/login-log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

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
    <ElDescriptions
      border
      :column="1"
      size="default"
      class="mx-4"
      :label-style="{ width: '110px' }"
    >
      <ElDescriptionsItem label="日志编号">
        {{ formData?.id }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作类型">
        <DictTag
          :type="DICT_TYPE.SYSTEM_LOGIN_TYPE"
          :value="formData?.logType"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="用户名称">
        {{ formData?.username }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="登录地址">
        {{ formData?.userIp }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="浏览器">
        {{ formData?.userAgent }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="登录结果">
        <DictTag
          :type="DICT_TYPE.SYSTEM_LOGIN_RESULT"
          :value="formData?.result"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="登录日期">
        {{ formatDateTime(formData?.createTime || '') }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
