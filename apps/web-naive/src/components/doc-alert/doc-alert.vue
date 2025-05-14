<script lang="ts" setup>
import { isDocAlertEnable } from '@vben/hooks';
import { openWindow } from '@vben/utils';

import { NAlert, NText } from 'naive-ui';

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
  <NAlert v-if="isDocAlertEnable()" type="info" show-icon class="mb-2 rounded">
    <NText @click="goToUrl"> 【{{ title }}】文档地址：{{ url }} </NText>
  </NAlert>
</template>
