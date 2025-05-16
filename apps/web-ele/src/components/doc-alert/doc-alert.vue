<script lang="ts" setup>
import { isDocAlertEnable } from '@vben/hooks';
import { openWindow } from '@vben/utils';

import { ElAlert, ElLink } from 'element-plus';

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
  <div class="mb-2 rounded">
    <ElAlert v-if="isDocAlertEnable()" type="info" :closable="false" show-icon>
      <ElLink type="primary" @click="goToUrl">
        【{{ title }}】文档地址：{{ url }}
      </ElLink>
    </ElAlert>
  </div>
</template>
