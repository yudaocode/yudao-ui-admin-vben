<script lang="ts" setup>
import type { StatsData } from './data';

import { onMounted, ref } from 'vue';

import { ComparisonCard, Page } from '@vben/common-ui';

import { ElCol, ElRow } from 'element-plus';

import { getStatisticsSummary } from '#/api/iot/statistics';

import { defaultStatsData } from './data';
import DeviceCountCard from './modules/device-count-card.vue';
import DeviceMapCard from './modules/device-map-card.vue';
import DeviceStateCountCard from './modules/device-state-count-card.vue';
import MessageTrendCard from './modules/message-trend-card.vue';

const loading = ref(true);
const statsData = ref<StatsData>(defaultStatsData);

/** 加载数据 */
async function loadData() {
  loading.value = true;
  try {
    statsData.value = await getStatisticsSummary();
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  loadData();
});
</script>

<template>
  <Page>
    <!-- 第一行：统计卡片 -->
    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="6">
        <ComparisonCard
          title="分类数量"
          :value="statsData.productCategoryCount"
          :today-count="statsData.productCategoryTodayCount"
          icon="menu"
          icon-color="text-blue-500"
          :loading="loading"
        />
      </ElCol>
      <ElCol :span="6">
        <ComparisonCard
          title="产品数量"
          :value="statsData.productCount"
          :today-count="statsData.productTodayCount"
          icon="box"
          icon-color="text-orange-500"
          :loading="loading"
        />
      </ElCol>
      <ElCol :span="6">
        <ComparisonCard
          title="设备数量"
          :value="statsData.deviceCount"
          :today-count="statsData.deviceTodayCount"
          icon="cpu"
          icon-color="text-purple-500"
          :loading="loading"
        />
      </ElCol>
      <ElCol :span="6">
        <ComparisonCard
          title="设备消息数"
          :value="statsData.deviceMessageCount"
          :today-count="statsData.deviceMessageTodayCount"
          icon="message"
          icon-color="text-teal-500"
          :loading="loading"
        />
      </ElCol>
    </ElRow>

    <!-- 第二行：图表 -->
    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="12">
        <DeviceCountCard :stats-data="statsData" :loading="loading" />
      </ElCol>
      <ElCol :span="12">
        <DeviceStateCountCard :stats-data="statsData" :loading="loading" />
      </ElCol>
    </ElRow>

    <!-- 第三行：消息统计 -->
    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="24">
        <MessageTrendCard />
      </ElCol>
    </ElRow>

    <!-- 第四行：设备分布地图 -->
    <ElRow :gutter="16">
      <ElCol :span="24">
        <DeviceMapCard />
      </ElCol>
    </ElRow>
  </Page>
</template>
