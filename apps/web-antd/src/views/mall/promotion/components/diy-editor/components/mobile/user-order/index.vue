<script setup lang="ts">
import type { UserOrderProperty } from './config';

/** 用户订单 */
defineOptions({ name: 'UserOrder' });
// 定义属性
defineProps<{ property: UserOrderProperty }>();
</script>
<template>
  <Image
    src="https://shopro.sheepjs.com/admin/static/images/shop/decorate/orderCardStyle.png"
  />
</template>

<style scoped lang="scss"></style>
