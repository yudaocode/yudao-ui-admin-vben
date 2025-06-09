<script lang="ts" setup>
import type { SummaryCardProps } from './typing';

import { CountTo } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Tooltip } from 'ant-design-vue';

/** 统计卡片 */
defineOptions({ name: 'SummaryCard' });

defineProps<SummaryCardProps>();
</script>
<template>
  <div
    class="flex flex-row items-center gap-3 rounded bg-[var(--el-bg-color-overlay)] p-4"
  >
    <div
      class="rounded-1 flex h-12 w-12 flex-shrink-0 items-center justify-center"
      :class="`${iconColor} ${iconBgColor}`"
    >
      <IconifyIcon v-if="icon" :icon="icon" class="!text-6" />
    </div>
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1">
        <span class="text-3.5">{{ title }}</span>
        <Tooltip :content="tooltip" placement="topLeft" v-if="tooltip">
          <IconifyIcon icon="ep:warning" class="item-center !text-3 flex" />
        </Tooltip>
      </div>
      <div class="flex flex-row items-baseline gap-2">
        <div class="text-7">
          <CountTo
            :prefix="prefix"
            :end-val="value ?? 0"
            :decimals="decimals ?? 0"
          />
        </div>
        <span
          v-if="percent !== undefined"
          :class="Number(percent) > 0 ? 'text-red-500' : 'text-green-500'"
        >
          <span class="text-sm">{{ Math.abs(Number(percent)) }}%</span>
          <IconifyIcon
            :icon="Number(percent) > 0 ? 'ep:caret-top' : 'ep:caret-bottom'"
            class="!text-3 ml-0.5"
          />
        </span>
      </div>
    </div>
  </div>
</template>
