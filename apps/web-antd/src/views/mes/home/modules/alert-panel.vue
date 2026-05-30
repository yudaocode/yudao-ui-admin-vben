<script lang="ts" setup>
import type { MesHomeApi } from '#/api/mes/home';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Badge, Card } from 'ant-design-vue';

defineOptions({ name: 'MesHomeAlertPanel' });

const props = defineProps<{
  summary: MesHomeApi.Summary;
}>();

const emit = defineEmits<{
  navigate: [name: string];
}>();

/** 待办提醒列表：标签、描述、图标、目标路由名称、数量 */
const alertItems = computed(() => [
  {
    count: props.summary.andonActiveCount,
    desc: '未处置的安灯呼叫',
    icon: 'lucide:bell-ring',
    iconClass: 'bg-red-50 text-red-500',
    label: '安灯报警',
    routeName: 'MesProAndonRecord',
  },
  {
    count: props.summary.repairActiveCount,
    desc: '待处理的维修工单',
    icon: 'lucide:wrench',
    iconClass: 'bg-orange-50 text-orange-500',
    label: '设备维修',
    routeName: 'MesDvRepair',
  },
  {
    count: props.summary.workOrderPrepareCount,
    desc: '草稿状态的生产工单',
    icon: 'lucide:clipboard-list',
    iconClass: 'bg-blue-50 text-blue-500',
    label: '待排产工单',
    routeName: 'MesProWorkOrder',
  },
]);
</script>

<template>
  <Card title="待办与异常" class="h-full">
    <div class="flex flex-col">
      <div
        v-for="item in alertItems"
        :key="item.label"
        class="hover:bg-accent flex cursor-pointer items-center gap-3 border-b px-2 py-4 transition-colors last:border-b-0"
        @click="emit('navigate', item.routeName)"
      >
        <div
          class="flex size-10 flex-shrink-0 items-center justify-center rounded-lg"
          :class="item.iconClass"
        >
          <IconifyIcon class="size-5" :icon="item.icon" />
        </div>
        <div class="flex flex-1 flex-col gap-0.5">
          <span class="text-sm font-medium">{{ item.label }}</span>
          <span class="text-muted-foreground text-xs">{{ item.desc }}</span>
        </div>
        <Badge :count="item.count" :show-zero="false" />
      </div>
    </div>
  </Card>
</template>
