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

<!-- TODO @puhui999：样式有点问题，间隔没了。可以看下 antd 版本的例子哈 -->
<template>
  <ElAlert
    v-if="isDocAlertEnable()"
    type="info"
    :closable="false"
    class="mb-2 rounded"
  >
    <ElLink type="primary" @click="goToUrl">
      【{{ title }}】文档地址：{{ url }}
    </ElLink>
  </ElAlert>
</template>
