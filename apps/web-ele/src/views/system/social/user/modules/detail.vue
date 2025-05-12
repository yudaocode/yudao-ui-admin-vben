<script lang="ts" setup>
import type { SystemSocialUserApi } from '#/api/system/social/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElDescriptions, ElDescriptionsItem, ElImage } from 'element-plus';

import { getSocialUser } from '#/api/system/social/user';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { DICT_TYPE } from '#/utils';

const formData = ref<SystemSocialUserApi.SocialUser>();

const [Modal, modalApi] = useVbenModal({
  title: $t('ui.actionTitle.detail'),
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSocialUser(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="社交用户详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <ElDescriptions
      :column="1"
      size="default"
      border
      class="mx-4"
      :label-width="185"
    >
      <ElDescriptionsItem label="社交平台">
        <DictTag :type="DICT_TYPE.SYSTEM_SOCIAL_TYPE" :value="formData?.type" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="用户昵称">
        {{ formData?.nickname }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="用户头像">
        <ElImage
          :src="formData?.avatar"
          :preview-src-list="formData?.avatar ? [formData.avatar] : []"
          style="width: 30px; height: 30px"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="社交 token">
        {{ formData?.token }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="原始 Token 数据">
        {{ formData?.rawTokenInfo }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="原始 User 数据">
        {{ formData?.rawUserInfo }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="最后一次的认证 code">
        {{ formData?.code }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="最后一次的认证 state">
        {{ formData?.state }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
