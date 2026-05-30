<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';

import { ElCard, ElCol, ElRow } from 'element-plus';

defineOptions({ name: 'MesHomeShortcuts' });

const emit = defineEmits<{
  navigate: [name: string];
}>();

/** 快捷入口列表，3×3 网格布局与工单状态分布面板等高 */
const shortcuts = [
  {
    bgColor: '#409EFF',
    icon: 'lucide:file-text',
    name: '生产工单',
    routeName: 'MesProWorkOrder',
  },
  {
    bgColor: '#67C23A',
    icon: 'lucide:edit',
    name: '生产报工',
    routeName: 'MesProFeedback',
  },
  {
    bgColor: '#E6A23C',
    icon: 'lucide:search',
    name: '质量检验',
    routeName: 'MesQcIqc',
  },
  {
    bgColor: '#F56C6C',
    icon: 'lucide:box',
    name: '库存查询',
    routeName: 'MesWmMaterialStock',
  },
  {
    bgColor: '#7c3aed',
    icon: 'lucide:cpu',
    name: '设备管理',
    routeName: 'MesDvMachinery',
  },
  {
    bgColor: '#0ea5e9',
    icon: 'lucide:list',
    name: '生产任务',
    routeName: 'MesProTask',
  },
  {
    bgColor: '#14b8a6',
    icon: 'lucide:truck',
    name: '到货通知',
    routeName: 'MesWmArrivalNotice',
  },
  {
    bgColor: '#f59e0b',
    icon: 'lucide:settings-2',
    name: '设备维修',
    routeName: 'MesDvRepair',
  },
  {
    bgColor: '#ec4899',
    icon: 'lucide:tickets',
    name: '流转卡',
    routeName: 'MesProCard',
  },
];
</script>

<template>
  <ElCard header="快捷入口" class="h-full">
    <ElRow :gutter="16">
      <ElCol v-for="item in shortcuts" :key="item.name" :span="8" class="mb-4">
        <div
          class="hover:bg-accent flex cursor-pointer flex-col items-center gap-2 rounded-lg py-3 transition-all hover:-translate-y-0.5"
          @click="emit('navigate', item.routeName)"
        >
          <div
            class="flex size-12 items-center justify-center rounded-xl text-white"
            :style="{ background: item.bgColor }"
          >
            <IconifyIcon class="size-6" :icon="item.icon" />
          </div>
          <span class="text-sm">{{ item.name }}</span>
        </div>
      </ElCol>
    </ElRow>
  </ElCard>
</template>
