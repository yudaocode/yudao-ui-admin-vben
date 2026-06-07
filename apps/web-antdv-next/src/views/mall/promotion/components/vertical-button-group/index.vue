<script setup lang="ts">
import { SpaceCompact } from 'antdv-next';

/**
 * 垂直按钮组
 * Ant Design Vue 的按钮组，通过 Space 实现垂直布局
 */
defineOptions({ name: 'VerticalSpace' });
</script>

<template>
  <Space v-bind="$attrs">
    <SpaceCompact orientation="vertical">
      <slot></slot>
    </SpaceCompact>
  </Space>
</template>
