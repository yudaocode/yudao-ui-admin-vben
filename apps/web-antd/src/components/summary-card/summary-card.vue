<script lang="ts" setup>
import type { SummaryCardProps } from './typing';

import { CountTo } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Card, Tooltip } from 'ant-design-vue';

/** 统计卡片 */
defineOptions({ name: 'SummaryCard' });

defineProps<SummaryCardProps>();
</script>
<template>
  <Card :bordered="false" class="h-full shadow-sm">
    <div class="flex flex-row items-center gap-3">
      <div
        class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded"
        :class="`${iconColor} ${iconBgColor}`"
      >
        <IconifyIcon v-if="icon" :icon="icon" class="!text-6" />
      </div>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <span class="text-sm text-gray-500">{{ title }}</span>
          <Tooltip :content="tooltip" placement="topLeft" v-if="tooltip">
            <IconifyIcon
              icon="lucide:circle-alert"
              class="item-center !text-3 flex"
            />
          </Tooltip>
        </div>
        <div class="flex flex-row items-baseline gap-2">
          <div class="text-2xl">
            <CountTo
              :prefix="prefix"
              :end-val="value ?? 0"
              :decimals="decimals ?? 0"
            />
          </div>
          <span
            v-if="percent !== undefined"
            :class="Number(percent) > 0 ? 'text-red-500' : 'text-green-500'"
            class="flex items-center"
          >
            <span class="text-sm">{{ Math.abs(Number(percent)) }}%</span>
            <IconifyIcon
              :icon="
                Number(percent) > 0
                  ? 'lucide:chevron-up'
                  : 'lucide:chevron-down'
              "
              class="ml-0.5 !text-sm"
            />
          </span>
        </div>
      </div>
    </div>
  </Card>
</template>
