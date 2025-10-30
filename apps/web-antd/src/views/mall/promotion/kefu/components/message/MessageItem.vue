<script lang="ts" setup>
import type { MallKefuMessageApi } from '#/api/mall/promotion/kefu/message';

import { UserTypeEnum } from '@vben/constants';

defineOptions({ name: 'MessageItem' });
defineProps<{
  message: MallKefuMessageApi.Message;
}>();
</script>

<template>
  <!-- 消息组件 -->
  <div
    :class="[
      message.senderType === UserTypeEnum.MEMBER
        ? `ml-[10px]`
        : message.senderType === UserTypeEnum.ADMIN
          ? `mr-[10px]`
          : '',
    ]"
  >
    <slot></slot>
  </div>
</template>
