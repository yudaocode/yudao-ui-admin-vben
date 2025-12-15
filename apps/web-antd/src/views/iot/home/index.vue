<script setup lang="ts">
import type { StatsData } from './data';

import { onMounted, ref } from 'vue';

import { ComparisonCard, Page } from '@vben/common-ui';

import { Col, Row } from 'ant-design-vue';

import { getStatisticsSummary } from '#/api/iot/statistics';

import { defaultStatsData } from './data';
import DeviceCountCard from './modules/device-count-card.vue';
import DeviceStateCountCard from './modules/device-state-count-card.vue';
import MessageTrendCard from './modules/message-trend-card.vue';

defineOptions({ name: 'IoTHome' });

const loading = ref(true);
const statsData = ref<StatsData>(defaultStatsData);

/** 加载统计数据 */
async function loadStatisticsData(): Promise<StatsData> {
  return await getStatisticsSummary();
}

/** 加载数据 */
async function loadData() {
  loading.value = true;
  try {
    statsData.value = await loadStatisticsData();
  } finally {
    loading.value = false;
  }
}

/** 组件挂载时加载数据 */
onMounted(() => {
  loadData();
});
</script>

<template>
  <Page>
    <!-- 第一行：统计卡片 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <ComparisonCard
          title="分类数量"
          :value="statsData.productCategoryCount"
          :today-count="statsData.productCategoryTodayCount"
          icon="menu"
          icon-color="text-blue-500"
          :loading="loading"
        />
      </Col>
      <Col :span="6">
        <ComparisonCard
          title="产品数量"
          :value="statsData.productCount"
          :today-count="statsData.productTodayCount"
          icon="box"
          icon-color="text-orange-500"
          :loading="loading"
        />
      </Col>
      <Col :span="6">
        <ComparisonCard
          title="设备数量"
          :value="statsData.deviceCount"
          :today-count="statsData.deviceTodayCount"
          icon="cpu"
          icon-color="text-purple-500"
          :loading="loading"
        />
      </Col>
      <Col :span="6">
        <ComparisonCard
          title="设备消息数"
          :value="statsData.deviceMessageCount"
          :today-count="statsData.deviceMessageTodayCount"
          icon="message"
          icon-color="text-teal-500"
          :loading="loading"
        />
      </Col>
    </Row>

    <!-- 第二行：图表 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="12">
        <DeviceCountCard :stats-data="statsData" :loading="loading" />
      </Col>
      <Col :span="12">
        <DeviceStateCountCard :stats-data="statsData" :loading="loading" />
      </Col>
    </Row>

    <!-- 第三行：消息统计 -->
    <Row :gutter="16">
      <Col :span="24">
        <MessageTrendCard />
      </Col>
    </Row>
  </Page>
</template>
