<script setup lang="ts">
import { Space } from 'ant-design-vue';

/**
 * 垂直按钮组
 * Ant Design Vue 的按钮组，通过 Space 实现垂直布局
 */
defineOptions({ name: 'VerticalButtonGroup' });
</script>

<template>
  <Space v-bind="$attrs">
    <Space.Compact direction="vertical">
      <slot></slot>
    </Space.Compact>
  </Space>
</template>
