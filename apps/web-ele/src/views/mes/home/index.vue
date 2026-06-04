<script lang="ts" setup>
import type { MesHomeApi } from '#/api/mes/home';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';

import { ElCol, ElRow } from 'element-plus';

import { getHomeSummary } from '#/api/mes/home';

import { defaultSummary } from './data';
import AlertPanel from './modules/alert-panel.vue';
import KpiCards from './modules/kpi-cards.vue';
import ProductionTrend from './modules/production-trend.vue';
import Shortcuts from './modules/shortcuts.vue';
import WorkOrderChart from './modules/work-order-chart.vue';

const router = useRouter();
const summary = ref<MesHomeApi.Summary>(defaultSummary); // 首页汇总统计

/** 跳转到目标页面（按路由 name） */
function handleNavigate(name: string) {
  router.push({ name });
}

/** 加载首页汇总统计 */
async function loadSummary() {
  summary.value = await getHomeSummary();
}

onMounted(() => {
  loadSummary();
});
</script>

<template>
  <Page>
    <template #doc>
      <DocAlert
        title="MES 手册（功能开启）"
        url="https://doc.iocoder.cn/mes/build/"
      />
    </template>

    <!-- 第一行：核心 KPI 汇总卡片 -->
    <KpiCards :summary="summary" class="mb-4" @navigate="handleNavigate" />

    <!-- 第二行：生产趋势 + 待办异常 -->
    <ElRow :gutter="16" class="mb-4">
      <ElCol :lg="16" :md="24" :sm="24" :xl="16" :xs="24" class="mb-4">
        <ProductionTrend />
      </ElCol>
      <ElCol :lg="8" :md="24" :sm="24" :xl="8" :xs="24" class="mb-4">
        <AlertPanel :summary="summary" @navigate="handleNavigate" />
      </ElCol>
    </ElRow>

    <!-- 第三行：工单分布 + 快捷入口 -->
    <ElRow :gutter="16">
      <ElCol :lg="12" :md="24" :sm="24" :xl="12" :xs="24" class="mb-4">
        <WorkOrderChart />
      </ElCol>
      <ElCol :lg="12" :md="24" :sm="24" :xl="12" :xs="24" class="mb-4">
        <Shortcuts @navigate="handleNavigate" />
      </ElCol>
    </ElRow>
  </Page>
</template>
