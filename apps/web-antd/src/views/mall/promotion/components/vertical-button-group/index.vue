<script setup lang="ts">
/**
 * 垂直按钮组
 * Element 官方的按钮组只支持水平显示，通过重写样式实现垂直布局
 */
defineOptions({ name: 'VerticalButtonGroup' });
</script>

<template>
  <ButtonGroup direction="vertical" v-bind="$attrs">
    <slot></slot>
  </ButtonGroup>
</template>

<style scoped lang="scss"></style>
