<script setup lang="ts">
import { Skeleton } from 'ant-design-vue';
</script>

<template>
  <div class="message-loading">
    <Skeleton active />
  </div>
</template>

<style scoped lang="scss">
.message-loading {
  padding: 30px;
}
</style>
