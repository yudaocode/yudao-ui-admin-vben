<script lang="ts" setup>
import { DocAlert, Page } from '@vben/common-ui';

import ProductRank from './components/product-rank.vue';
import ProductSummary from './components/product-summary.vue';
</script>

<template>
  <Page>
    <DocAlert
      title="【统计】会员、商品、交易统计"
      url="https://doc.iocoder.cn/mall/statistics/"
    />
    <ProductSummary class="md:w-3/3 mt-5 md:mr-4 md:mt-0" />
    <ProductRank class="md:w-3/3 mt-5 md:mr-4 md:mt-0" />
  </Page>
</template>
