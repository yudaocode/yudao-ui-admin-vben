<script setup lang="ts">
import type { UserCardProperty } from './config';

/** 用户卡片 */
defineOptions({ name: 'UserCard' });
// 定义属性
defineProps<{ property: UserCardProperty }>();
</script>
<template>
  <div class="flex flex-col">
    <div class="p-x-18px p-y-24px flex items-center justify-between">
      <div class="gap-16px flex flex-1 items-center">
        <el-avatar :size="60">
          <Icon icon="ep:avatar" :size="60" />
        </el-avatar>
        <span class="text-18px font-bold">芋道源码</span>
      </div>
      <Icon icon="tdesign:qrcode" :size="20" />
    </div>
    <div
      class="p-x-20px p-y-8px text-12px flex items-center justify-between bg-white"
    >
      <span class="color-#ff690d">点击绑定手机号</span>
      <span class="rounded-26px bg-#ff6100 p-x-8px p-y-5px color-white">
        去绑定
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
