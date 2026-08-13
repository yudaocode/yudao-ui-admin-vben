<script lang="ts" setup>
import { ElCard, ElTag } from 'element-plus';

defineOptions({ name: 'FmsClosingStatusCard' });

defineProps<{
  tagLabel: string; // 状态标签文本
  tagType: 'danger' | 'info' | 'success' | 'warning'; // 状态标签类型
  title: string; // 检查项名称
  value: string; // 检查项结果文本
}>();
</script>

<template>
  <ElCard class="min-h-[132px]" shadow="never">
    <div class="text-muted-foreground">{{ title }}</div>
    <div class="my-3 text-[22px] font-semibold">{{ value }}</div>
    <ElTag :type="tagType">{{ tagLabel }}</ElTag>
  </ElCard>
</template>
