<script lang="ts" setup>
import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { ElButton, ElCard } from 'element-plus';

defineOptions({ name: 'OaHomePanel' });
defineProps<{ title: string }>();

const collapsed = ref(false); // 当前面板是否收起
const visible = ref(true); // 关闭后刷新页面恢复
</script>

<template>
  <ElCard
    v-if="visible"
    shadow="never"
    :body-style="collapsed ? { padding: '0' } : undefined"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <span>{{ title }}</span>
        <div class="flex items-center gap-2">
          <slot name="actions"></slot>
          <ElButton
            link
            :aria-label="`${collapsed ? '展开' : '收起'}${title}`"
            @click="collapsed = !collapsed"
          >
            <IconifyIcon :icon="collapsed ? 'ep:arrow-down' : 'ep:arrow-up'" />
          </ElButton>
          <ElButton link :aria-label="`关闭${title}`" @click="visible = false">
            <IconifyIcon icon="ep:close" />
          </ElButton>
        </div>
      </div>
    </template>
    <div v-if="!collapsed"><slot></slot></div>
  </ElCard>
</template>
