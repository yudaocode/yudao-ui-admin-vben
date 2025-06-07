<!--
  参考自 https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/components/ContentWrap/src/ContentWrap.vue
  保证和 yudao-ui-admin-vue3 功能的一致性
-->
<script lang="ts" setup>
import type { CSSProperties } from 'vue';

import { ShieldQuestion } from '@vben/icons';

import { ElCard, ElTooltip } from 'element-plus';

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
  <ElCard :body-style="bodyStyle" :header="title" class="mb-4">
    <template v-if="title" #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <span class="text-4 font-[700]">{{ title }}</span>
          <ElTooltip placement="right">
            <template #content>
              <div class="max-w-[200px]">{{ message }}</div>
            </template>
            <ShieldQuestion :size="14" class="ml-5px" />
          </ElTooltip>
          <div class="pl-20px flex flex-grow">
            <slot name="header"></slot>
          </div>
        </div>
        <div>
          <slot name="extra"></slot>
        </div>
      </div>
    </template>
    <template #default>
      <slot></slot>
    </template>
  </ElCard>
</template>
