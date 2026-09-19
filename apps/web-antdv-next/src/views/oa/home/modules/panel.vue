<script lang="ts" setup>
import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Card } from 'antdv-next';

defineOptions({ name: 'OaHomePanel' });
defineProps<{ title: string }>();

const collapsed = ref(false); // 当前面板是否收起
const visible = ref(true); // 关闭后刷新页面恢复
</script>

<template>
  <Card
    v-if="visible"
    :title="title"
    :body-style="collapsed ? { padding: '0' } : undefined"
  >
    <template #extra>
      <div class="flex items-center gap-2">
        <slot name="actions"></slot>
        <Button
          type="link"
          :aria-label="`${collapsed ? '展开' : '收起'}${title}`"
          @click="collapsed = !collapsed"
        >
          <IconifyIcon :icon="collapsed ? 'ep:arrow-down' : 'ep:arrow-up'" />
        </Button>
        <Button type="link" :aria-label="`关闭${title}`" @click="visible = false">
          <IconifyIcon icon="ep:close" />
        </Button>
      </div>
    </template>
    <div v-if="!collapsed"><slot></slot></div>
  </Card>
</template>
