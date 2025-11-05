<script setup lang="ts">
import { ButtonGroup } from 'ant-design-vue';

/**
 * 垂直按钮组
 * Ant Design Vue 的按钮组只支持水平显示，通过重写样式实现垂直布局
 */
defineOptions({ name: 'VerticalButtonGroup' });
</script>

<template>
  <ButtonGroup v-bind="$attrs" class="!inline-flex !flex-col">
    <slot></slot>
  </ButtonGroup>
</template>

<style scoped lang="scss">
// TODO @AI:圆角的样式不太对！
.ant-btn-group > :deep(.ant-btn:first-child) {
  border-bottom-color: transparent;
  border-radius: hsl(var(--radius)) hsl(var(--radius)) 0 0;
}

.ant-btn-group > :deep(.ant-btn:last-child) {
  border-top-color: transparent;
  border-radius: 0 0 hsl(var(--radius)) hsl(var(--radius));
}

.ant-btn-group :deep(.ant-btn:not(:first-child):not(:last-child)) {
  border-top-color: transparent;
  border-bottom-color: transparent;
  border-radius: 0;
}

.ant-btn-group > :deep(.ant-btn:not(:last-child)) {
  margin-right: 0;
  margin-bottom: -1px;
}
</style>
