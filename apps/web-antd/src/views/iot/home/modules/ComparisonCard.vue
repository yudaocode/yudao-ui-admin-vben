<template>
  <Card class="stat-card" :loading="loading">
    <div class="flex flex-col h-full">
      <div class="flex justify-between items-start mb-4">
        <div class="flex flex-col flex-1">
          <span class="text-gray-500 text-sm font-medium mb-2">{{ title }}</span>
          <span class="text-3xl font-bold text-gray-800">
            <span v-if="value === -1">--</span>
            <CountTo v-else :end-val="value" :duration="1000" />
          </span>
        </div>
        <div :class="`text-4xl ${iconColor}`">
          <IconComponent />
        </div>
      </div>
      
      <div class="mt-auto pt-3 border-t border-gray-100">
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-400">今日新增</span>
          <span v-if="todayCount === -1" class="text-gray-400">--</span>
          <span v-else class="text-green-500 font-medium">+{{ todayCount }}</span>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { Card } from 'ant-design-vue';
import { CountTo } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { computed } from 'vue';

defineOptions({ name: 'ComparisonCard' });

const props = defineProps<{
  title: string;
  value: number;
  todayCount: number;
  icon: string;
  iconColor?: string;
  loading?: boolean;
}>();

const iconMap: Record<string, any> = {
  'menu': createIconifyIcon('ant-design:appstore-outlined'),
  'box': createIconifyIcon('ant-design:box-plot-outlined'),
  'cpu': createIconifyIcon('ant-design:cluster-outlined'),
  'message': createIconifyIcon('ant-design:message-outlined'),
};

const IconComponent = computed(() => iconMap[props.icon] || iconMap.menu);
</script>

<style scoped>
.stat-card {
  height: 160px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.stat-card :deep(.ant-card-body) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
