<script lang="ts" setup>
import { computed } from 'vue';

import { VbenCountToAnimator } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Card, Tooltip } from 'ant-design-vue';

/** 交易统计值组件 */
defineOptions({ name: 'TradeStatisticCard' });

const props = withDefaults(defineProps<Props>(), {
  tooltip: '',
  title: '',
  prefix: '',
  value: 0,
  decimals: 0,
  percent: 0,
});

interface Props {
  tooltip?: string;
  title?: string;
  prefix?: string;
  value?: number | string;
  decimals?: number;
  percent?: number | string;
}

/** 计算环比百分比 */
const percentValue = computed(() => {
  return Number(props.percent);
});

/** 格式化数值 */
const formattedValue = computed(() => {
  return Number(props.value);
});
</script>

<template>
  <Card :bordered="false" class="h-full">
    <div class="flex flex-col gap-2 p-2">
      <div class="flex items-center justify-between text-gray-500">
        <span class="text-sm">{{ title }}</span>
        <Tooltip v-if="tooltip" :title="tooltip" placement="top">
          <IconifyIcon
            icon="lucide:circle-alert"
            class="size-4 cursor-help text-gray-400 hover:text-gray-600"
          />
        </Tooltip>
      </div>
      <div class="mb-4 text-3xl font-medium">
        <VbenCountToAnimator
          :prefix="prefix"
          :end-val="formattedValue"
          :decimals="decimals"
        />
      </div>
      <div class="flex flex-row gap-1 text-sm">
        <span class="text-gray-500">环比</span>
        <span
          :class="percentValue > 0 ? 'text-red-500' : 'text-green-500'"
          class="flex items-center gap-0.5"
        >
          {{ Math.abs(percentValue).toFixed(2) }}%
          <IconifyIcon
            :icon="
              percentValue > 0 ? 'lucide:trending-up' : 'lucide:trending-down'
            "
            class="size-3"
          />
        </span>
      </div>
    </div>
  </Card>
</template>
