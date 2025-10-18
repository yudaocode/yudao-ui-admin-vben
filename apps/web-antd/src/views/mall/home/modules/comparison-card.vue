<script lang="ts" setup>
import { computed } from 'vue';

import { Card, Tag } from 'ant-design-vue';

import { IconifyIcon } from '@vben/icons';

import { erpCalculatePercentage } from '@vben/utils';

/** 交易对照卡片 */
defineOptions({ name: 'ComparisonCard' });

interface Props {
  title: string;
  tag?: string;
  prefix?: string;
  value: number | string;
  reference: number | string;
  decimals?: number;
}

const props = withDefaults(defineProps<Props>(), {
  tag: '',
  prefix: '',
  decimals: 0,
});

// 计算环比
const percent = computed(() => {
  const refValue = Number(props.reference);
  const curValue = Number(props.value);
  if (!refValue || refValue === 0) return 0;
  return ((curValue - refValue) / refValue) * 100;
});

// 格式化数值
const formattedValue = computed(() => {
  const numValue = Number(props.value);
  return numValue.toFixed(props.decimals);
});

const formattedReference = computed(() => {
  const numValue = Number(props.reference);
  return numValue.toFixed(props.decimals);
});
</script>

<template>
  <Card :bordered="false" class="comparison-card">
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between text-gray-500">
        <span>{{ title }}</span>
        <Tag v-if="tag">{{ tag }}</Tag>
      </div>
      <div class="flex items-baseline justify-between">
        <div class="text-3xl font-semibold">
          {{ prefix }}{{ formattedValue }}
        </div>
        <span :class="percent > 0 ? 'text-red-500' : 'text-green-500'">
          {{ Math.abs(percent).toFixed(2) }}%
          <IconifyIcon
            :icon="percent > 0 ? 'ep:caret-top' : 'ep:caret-bottom'"
            class="text-sm"
          />
        </span>
      </div>
      <div class="mt-2 border-t border-gray-200 pt-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">昨日数据</span>
          <span>{{ prefix }}{{ formattedReference }}</span>
        </div>
      </div>
    </div>
  </Card>
</template>

<style lang="less" scoped>
.comparison-card {
  height: 100%;
}
</style>

