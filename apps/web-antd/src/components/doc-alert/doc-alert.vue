<script lang="ts" setup>
// TODO @芋艿：貌似不用 src 目录
import { computed } from 'vue';
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
  window.open(props.url);
};

/** 是否开启 */
const isEnabled = computed(() => {
  return import.meta.env.VITE_APP_DOCALERT_ENABLE !== 'false';
});
</script>

<template>
  <Alert
    v-if="isEnabled"
    type="info"
    show-icon
    class="mb-2 rounded"
  >
    <template #message>
      <Typography.Link @click="goToUrl">
        【{{ title }}】文档地址：{{ url }}
      </Typography.Link>
    </template>
  </Alert>
</template>
