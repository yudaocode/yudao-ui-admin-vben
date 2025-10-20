<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { ElCard } from 'element-plus';

/** 快捷入口卡片 */
defineOptions({ name: 'ShortcutCard' });

const router = useRouter();

/** 菜单列表 */
const menuList = [
  {
    name: '用户管理',
    icon: 'ep:user-filled',
    bgColor: 'bg-red-400',
    routerPath: '/member/user',
  },
  {
    name: '商品管理',
    icon: 'fluent-mdl2:product',
    bgColor: 'bg-orange-400',
    routerPath: '/mall/product/spu',
  },
  {
    name: '订单管理',
    icon: 'ep:list',
    bgColor: 'bg-yellow-500',
    routerPath: '/mall/trade/order',
  },
  {
    name: '售后管理',
    icon: 'ri:refund-2-line',
    bgColor: 'bg-green-600',
    routerPath: '/mall/trade/after-sale',
  },
  {
    name: '分销管理',
    icon: 'fa-solid:project-diagram',
    bgColor: 'bg-cyan-500',
    routerPath: '/mall/trade/brokerage/brokerage-user',
  },
  {
    name: '优惠券',
    icon: 'ep:ticket',
    bgColor: 'bg-blue-500',
    routerPath: '/mall/promotion/coupon/template',
  },
  {
    name: '拼团活动',
    icon: 'fa:group',
    bgColor: 'bg-purple-500',
    routerPath: '/mall/promotion/combination/acitivity',
  },
  {
    name: '佣金提现',
    icon: 'vaadin:money-withdraw',
    bgColor: 'bg-rose-500',
    routerPath: '/mall/trade/brokerage/brokerage-withdraw',
  },
];

/** 跳转到菜单对应页面 */
function handleMenuClick(routerPath: string) {
  router.push({ path: routerPath });
}
</script>

<template>
  <ElCard :border="false">
    <template #header>
      <div>快捷入口</div>
    </template>
    <div class="flex flex-row flex-wrap gap-8 p-4">
      <div
        v-for="menu in menuList"
        :key="menu.name"
        class="flex h-20 w-[20%] cursor-pointer flex-col items-center justify-center gap-2"
        @click="handleMenuClick(menu.routerPath)"
      >
        <div
          :class="menu.bgColor"
          class="flex h-12 w-12 items-center justify-center rounded text-white"
        >
          <IconifyIcon :icon="menu.icon" class="text-2xl" />
        </div>
        <span>{{ menu.name }}</span>
      </div>
    </div>
  </ElCard>
</template>
