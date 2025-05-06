<script lang="ts" setup>
import { isDocAlertEnable } from '@vben/hooks';
import { openWindow } from '@vben/utils';

import { Alert, Typography } from 'ant-design-vue';

export interface DocAlertProps {
  /**
   * 文档标题
   */
  title: string;
  /**
   * 文档 URL 地址
   */
  url: string;
}

const props = defineProps<DocAlertProps>();

/** 跳转 URL 链接 */
const goToUrl = () => {
  openWindow(props.url);
};
</script>

<template>
  <Alert v-if="isDocAlertEnable()" type="info" show-icon class="mb-2 rounded">
    <template #message>
      <Typography.Link @click="goToUrl">
        【{{ title }}】文档地址：{{ url }}
      </Typography.Link>
    </template>
  </Alert>
</template>
