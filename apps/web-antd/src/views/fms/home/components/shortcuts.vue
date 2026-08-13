<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';

import { Card } from 'ant-design-vue';

import { useFmsStore } from '#/views/fms/store/fms';

defineOptions({ name: 'FmsHomeShortcuts' });

const SHORTCUTS = [
  {
    name: '录凭证',
    description: '新增会计凭证',
    icon: 'lucide:square-pen',
    path: '/fms/voucher/create',
    permission: 'fms:voucher:create',
    writeRequired: true,
  },
  {
    name: '查凭证',
    description: '查询会计凭证',
    icon: 'lucide:search',
    path: '/fms/voucher/list',
    permission: 'fms:voucher:query',
    writeRequired: false,
  },
  {
    name: '科目余额表',
    description: '查看科目余额',
    icon: 'lucide:bar-chart-3',
    path: '/fms/ledger/subject-balance',
    permission: 'fms:ledger:subject-balance:query',
    writeRequired: false,
  },
  {
    name: '明细账',
    description: '查看科目明细',
    icon: 'lucide:file-text',
    path: '/fms/ledger/detail',
    permission: 'fms:ledger:detail:query',
    writeRequired: false,
  },
]; // 常用功能

const router = useRouter(); // 路由实例
const fmsStore = useFmsStore(); // FMS Store
const { hasAccessByCodes } = useAccess();
const visibleShortcuts = computed(() =>
  SHORTCUTS.filter(
    (shortcut) =>
      hasAccessByCodes([shortcut.permission]) &&
      (!shortcut.writeRequired || fmsStore.isAccountSetWritable),
  ),
); // 可见的常用功能

/** 跳转常用功能 */
function goTo(path: string) {
  router.push(path);
}
</script>

<template>
  <Card v-if="visibleShortcuts.length > 0">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-[16px] font-semibold">常用功能</div>
        <div class="text-muted-foreground mt-1.5 text-[13px]">
          快速进入日常财务工作
        </div>
      </div>
    </div>

    <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <button
        v-for="shortcut in visibleShortcuts"
        :key="shortcut.path"
        class="group bg-primary/10 hover:border-primary/50 flex items-center gap-3.5 rounded-lg border border-transparent p-4 text-left transition-all hover:-translate-y-0.5"
        type="button"
        @click="goTo(shortcut.path)"
      >
        <span
          class="bg-primary flex h-[42px] w-[42px] flex-none items-center justify-center rounded-lg text-[22px] text-white shadow"
        >
          <IconifyIcon :icon="shortcut.icon" />
        </span>
        <span>
          <strong class="block text-[15px] font-medium">
            {{ shortcut.name }}
          </strong>
          <small class="text-muted-foreground mt-1 block text-[12px]">
            {{ shortcut.description }}
          </small>
        </span>
      </button>
    </div>
  </Card>
</template>
