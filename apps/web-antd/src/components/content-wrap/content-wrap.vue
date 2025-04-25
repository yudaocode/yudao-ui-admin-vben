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
</script>

<template>
  <Card :body-style="bodyStyle" :title="title" class="mb-4">
    <slot></slot>
  </Card>
</template>
