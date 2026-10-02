<script lang="ts" setup>
import type { ImManagerStatisticsApi } from '#/api/im/manager/statistics';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { getStatisticsOverview } from '#/api/im/manager/statistics';

import { DistributionChart, OverviewCards, TrendChart } from './components';

defineOptions({ name: 'ImManagerStatistics' });

const overview = ref<Partial<ImManagerStatisticsApi.Overview>>({});
const loading = ref(false);

/** 加载概览数据 */
async function loadOverview() {
  loading.value = true;
  try {
    overview.value = await getStatisticsOverview();
  } finally {
    loading.value = false;
  }
}

onMounted(loadOverview);
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4">
      <OverviewCards :overview="overview" :loading="loading" />

      <div class="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
        <TrendChart type="message" />
        <TrendChart type="user" />
      </div>

      <div
        class="grid grid-cols-3 gap-4 max-2xl:grid-cols-2 max-xl:grid-cols-1"
      >
        <DistributionChart type="messageType" />
        <DistributionChart type="groupSize" />
        <DistributionChart type="topSenders" />
      </div>
    </div>
  </Page>
</template>
