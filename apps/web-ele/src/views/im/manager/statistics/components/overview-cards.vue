<script lang="ts" setup>
import type { ImManagerStatisticsApi } from '#/api/im/manager/statistics';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { ElCard } from 'element-plus'

defineOptions({ name: 'ImManagerStatisticsOverviewCards' });

const props = defineProps<{
  overview: ImManagerStatisticsApi.Overview;
}>();

/** 计算环比 */
function calcRatio(today: number, yesterday: number) {
  if (!yesterday) {
    return { label: '无昨日数据', className: 'text-gray-400' };
  }
  const diff = ((today - yesterday) / yesterday) * 100;
  const sign = diff >= 0 ? '+' : '';
  return {
    label: `${sign}${diff.toFixed(1)}%`,
    className: diff >= 0 ? 'text-green-500' : 'text-red-500',
  };
}

const cards = computed(() => {
  const overview = props.overview;
  const totalMsgToday =
    (overview.privateMessageToday || 0) + (overview.groupMessageToday || 0);
  const totalMsgYesterday =
    (overview.privateMessageYesterday || 0) +
    (overview.groupMessageYesterday || 0);
  const msgRatio = calcRatio(totalMsgToday, totalMsgYesterday);
  return [
    {
      title: '总用户',
      value: overview.totalUser || 0,
      icon: 'lucide:user',
      color: '#2f7df6',
      metaLabel: '今日新增',
      metaValue: `+${overview.newUserToday || 0}`,
      metaClass: 'text-green-500',
    },
    {
      title: '总群组',
      value: overview.totalGroup || 0,
      icon: 'lucide:messages-square',
      color: '#18a058',
      metaLabel: '今日新增',
      metaValue: `+${overview.newGroupToday || 0}`,
      metaClass: 'text-green-500',
    },
    {
      title: '日活用户',
      value: overview.activeUserDaily || 0,
      icon: 'lucide:timer',
      color: '#f59e0b',
      metaLabel: '周/月活',
      metaValue: `${overview.activeUserWeekly || 0} / ${overview.activeUserMonthly || 0}`,
      metaClass: 'text-gray-500',
    },
    {
      title: '今日消息',
      value: totalMsgToday,
      suffix: `（P ${overview.privateMessageToday}/G ${overview.groupMessageToday}）`,
      icon: 'lucide:message-circle',
      color: '#64748b',
      metaLabel: '环比昨日',
      metaValue: msgRatio.label,
      metaClass: msgRatio.className,
    },
  ];
});
</script>

<template>
  <div class="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
    <ElCard v-for="card in cards" :key="card.title" :body-style="{ padding: '16px' }">
      <div class="flex items-center">
        <div
          class="mr-3 flex size-12 shrink-0 items-center justify-center rounded"
          :style="{ backgroundColor: card.color }"
        >
          <IconifyIcon :icon="card.icon" class="size-6 text-white" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-1 text-sm text-muted-foreground">{{ card.title }}</div>
          <div class="truncate text-2xl font-semibold leading-none">
            {{ card.value }}
            <span v-if="card.suffix" class="ml-1 text-xs font-normal text-gray-400">
              {{ card.suffix }}
            </span>
          </div>
          <div class="mt-2 text-xs text-gray-400">
            {{ card.metaLabel }}：
            <span :class="card.metaClass">{{ card.metaValue }}</span>
          </div>
        </div>
      </div>
    </ElCard>
  </div>
</template>
