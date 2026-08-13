<script lang="ts" setup>
import { computed } from 'vue';

import { Card, Tag } from 'ant-design-vue';

defineOptions({ name: 'FmsClosingStatusCard' });

const props = defineProps<{
  tagLabel: string; // 状态标签文本
  tagType: 'danger' | 'info' | 'success' | 'warning'; // 状态标签类型
  title: string; // 检查项名称
  value: string; // 检查项结果文本
}>();

/** 状态标签颜色，对齐源 el-tag 的类型语义 */
const tagColor = computed(
  () =>
    ({
      danger: 'error',
      info: undefined,
      success: 'success',
      warning: 'warning',
    })[props.tagType],
);
</script>

<template>
  <Card class="min-h-[132px]">
    <div class="text-muted-foreground">{{ title }}</div>
    <div class="my-3 text-[22px] font-semibold">{{ value }}</div>
    <Tag :color="tagColor">{{ tagLabel }}</Tag>
  </Card>
</template>
