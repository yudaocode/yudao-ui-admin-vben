<script lang="ts" setup>
interface Props {
  title: string;
}

defineProps<Props>();
</script>

<template>
  <span class="card-title">{{ title }}</span>
</template>

<style scoped>
.card-title {
  position: relative;
  padding-left: 12px;
  font-size: 14px;
  font-weight: 600;
}

.card-title::before {
  position: absolute;
  top: 50%;
  left: 0;
  display: inline-block;
  width: 3px;
  height: 14px;
  content: '';
  background: #1890ff;
  border-radius: 2px;
  transform: translateY(-50%);
}
</style>
