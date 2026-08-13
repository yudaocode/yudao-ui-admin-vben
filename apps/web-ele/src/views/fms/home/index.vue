<script lang="ts" setup>
import type { FmsHomeApi } from '#/api/fms/home';

import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { ElCard } from 'element-plus';

import { getHome, getHomeMetricDetail } from '#/api/fms/home';
import { useFmsStore } from '#/views/fms/store/fms';

import FmsHomeMetricCards from './components/metric-cards.vue';
import FmsHomeMetricCharts from './components/metric-charts.vue';
import FmsHomeShortcuts from './components/shortcuts.vue';

defineOptions({ name: 'FmsHome' });

const fmsStore = useFmsStore(); // FMS Store

const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const loading = ref(false); // 首页加载状态
const metricLoading = ref(false); // 指标明细加载状态
const home = ref<FmsHomeApi.Home>(); // 首页数据
const metricDetail = ref<FmsHomeApi.HomeMetricDetail>(); // 指标明细
const selectedMetricKey = ref<string>(); // 选中的指标标识
let metricRequestSequence = 0; // 指标明细请求序号

/** 初始化首页 */
async function init() {
  metricRequestSequence++;
  home.value = undefined;
  metricLoading.value = false;
  selectedMetricKey.value = undefined;
  metricDetail.value = undefined;
  const currentAccountSetId = accountSetId.value;
  if (!currentAccountSetId) {
    loading.value = false;
    return;
  }
  await getHomeData(currentAccountSetId);
}

/** 加载首页数据 */
async function getHomeData(currentAccountSetId: number) {
  loading.value = true;
  try {
    const result = await getHome(currentAccountSetId);
    if (accountSetId.value === currentAccountSetId) {
      home.value = result;
      const firstMetric = result.metrics[0];
      if (firstMetric) await selectMetric(firstMetric);
    }
  } finally {
    if (accountSetId.value === currentAccountSetId) {
      loading.value = false;
    }
  }
}

/** 选择财务指标 */
async function selectMetric(metric: FmsHomeApi.HomeMetric) {
  const currentAccountSetId = accountSetId.value;
  if (!currentAccountSetId) return;
  const requestSequence = ++metricRequestSequence;
  selectedMetricKey.value = metric.key;
  metricDetail.value = undefined;
  metricLoading.value = true;
  try {
    const result = await getHomeMetricDetail(currentAccountSetId, metric.key);
    if (requestSequence === metricRequestSequence) {
      metricDetail.value = result;
    }
  } finally {
    if (requestSequence === metricRequestSequence) {
      metricLoading.value = false;
    }
  }
}

watch(accountSetId, init, { immediate: true });
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <FmsHomeShortcuts />
      <ElCard>
        <div v-loading="loading">
          <FmsHomeMetricCards
            :home="home"
            :selected-metric-key="selectedMetricKey"
            @select="selectMetric"
          />
          <FmsHomeMetricCharts
            class="mt-7"
            :home="home"
            :metric-detail="metricDetail"
            :selected-metric-key="selectedMetricKey"
            :loading="metricLoading"
          />
        </div>
      </ElCard>
    </div>
  </Page>
</template>
