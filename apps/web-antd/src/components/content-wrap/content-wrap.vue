<!--
  参考自 https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/components/ContentWrap/src/ContentWrap.vue
  保证和 yudao-ui-admin-vue3 功能的一致性
-->
<script lang="ts" setup>
import type { CSSProperties } from 'vue';

import { ShieldQuestion } from '@vben/icons';

import { Card, Tooltip } from 'ant-design-vue';

defineOptions({ name: 'ContentWrap' });

withDefaults(
  defineProps<{
    bodyStyle?: CSSProperties;
    message?: string;
    title?: string;
  }>(),
  {
    bodyStyle: () => ({ padding: '10px' }),
    title: '',
    message: '',
  },
);
</script>

<template>
  <Card :body-style="bodyStyle" :title="title" class="mb-4">
    <template v-if="title" #title>
      <div class="flex items-center">
        <span class="text-base font-bold">{{ title }}</span>
        <Tooltip placement="right">
          <template #title>
            <div class="max-w-[200px]">{{ message }}</div>
          </template>
          <ShieldQuestion :size="14" class="ml-1" />
        </Tooltip>
        <div class="flex flex-grow pl-5">
          <slot name="header"></slot>
        </div>
      </div>
    </template>
    <template #extra>
      <slot name="extra"></slot>
    </template>
    <slot></slot>
  </Card>
</template>
