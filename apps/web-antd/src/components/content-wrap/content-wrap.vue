<!--
  参考自 https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/components/ContentWrap/src/ContentWrap.vue
  保证和 yudao-ui-admin-vue3 功能的一致性
-->
<script lang="ts" setup>
import type { CSSProperties } from 'vue';

import { Card } from 'ant-design-vue';

defineOptions({ name: 'ContentWrap' });

withDefaults(
  defineProps<{
    bodyStyle?: CSSProperties;
    title?: string;
  }>(),
  {
    bodyStyle: () => ({ padding: '10px' }),
    title: '',
  },
);
// TODO @puhui999：这个功能，和 vue3 貌似没对全哇？
</script>

<template>
  <Card :body-style="bodyStyle" :title="title" class="mb-4">
    <slot></slot>
  </Card>
</template>
