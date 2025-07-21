<script lang="ts" setup>
import type { ErpPurchaseStatisticsApi } from '#/api/erp/statistics/purchase';
import type { ErpSaleStatisticsApi } from '#/api/erp/statistics/sale';

import { onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { Col, Row, Spin } from 'ant-design-vue';

import {
  getPurchaseSummary,
  getPurchaseTimeSummary,
} from '#/api/erp/statistics/purchase';
import { getSaleSummary, getSaleTimeSummary } from '#/api/erp/statistics/sale';

import SummaryCard from './components/SummaryCard.vue';
import TimeSummaryChart from './components/TimeSummaryChart.vue';

/** ERP首页 */
defineOptions({ name: 'ErpHome' });

const loading = ref(true); // 加载中

/** 获得销售统计 */
const saleSummary = ref<ErpSaleStatisticsApi.SaleSummary>(); // 销售概况统计
const saleTimeSummaryList = ref<ErpSaleStatisticsApi.SaleTimeSummary[]>(); // 销售时段统计
const getSaleStatistics = async () => {
  saleSummary.value = await getSaleSummary();
  saleTimeSummaryList.value = await getSaleTimeSummary();
};

/** 获得采购统计 */
const purchaseSummary = ref<ErpPurchaseStatisticsApi.PurchaseSummary>(); // 采购概况统计
const purchaseTimeSummaryList =
  ref<ErpPurchaseStatisticsApi.PurchaseTimeSummary[]>(); // 采购时段统计
const getPurchaseStatistics = async () => {
  purchaseSummary.value = await getPurchaseSummary();
  purchaseTimeSummaryList.value = await getPurchaseTimeSummary();
};

/** 初始化 */
onMounted(async () => {
  loading.value = true;
  await Promise.all([getSaleStatistics(), getPurchaseStatistics()]);
  loading.value = false;
});
</script>

<template>
  <Page>
    <template #doc>
      <DocAlert
        title="ERP 手册（功能开启）"
        url="https://doc.iocoder.cn/erp/build/"
      />
    </template>

    <Spin :spinning="loading">
      <div class="flex flex-col gap-4">
        <!-- 销售/采购的全局统计 -->
        <Row :gutter="16">
          <Col :md="6" :sm="12" :xs="24">
            <SummaryCard title="今日销售" :value="saleSummary?.todayPrice" />
          </Col>
          <Col :md="6" :sm="12" :xs="24">
            <SummaryCard
              title="昨日销售"
              :value="saleSummary?.yesterdayPrice"
            />
          </Col>
          <Col :md="6" :sm="12" :xs="24">
            <SummaryCard
              title="今日采购"
              :value="purchaseSummary?.todayPrice"
            />
          </Col>
          <Col :md="6" :sm="12" :xs="24">
            <SummaryCard
              title="昨日采购"
              :value="purchaseSummary?.yesterdayPrice"
            />
          </Col>
          <Col :md="6" :sm="12" :xs="24">
            <SummaryCard title="本月销售" :value="saleSummary?.monthPrice" />
          </Col>
          <Col :md="6" :sm="12" :xs="24">
            <SummaryCard title="今年销售" :value="saleSummary?.yearPrice" />
          </Col>
          <Col :md="6" :sm="12" :xs="24">
            <SummaryCard
              title="本月采购"
              :value="purchaseSummary?.monthPrice"
            />
          </Col>
          <Col :md="6" :sm="12" :xs="24">
            <SummaryCard title="今年采购" :value="purchaseSummary?.yearPrice" />
          </Col>
        </Row>

        <!-- 销售/采购的时段统计 -->
        <Row :gutter="16">
          <!-- 销售统计 -->
          <Col :md="12" :sm="12" :xs="24">
            <TimeSummaryChart title="销售统计" :value="saleTimeSummaryList" />
          </Col>
          <!-- 采购统计 -->
          <Col :md="12" :sm="12" :xs="24">
            <TimeSummaryChart
              title="采购统计"
              :value="purchaseTimeSummaryList"
            />
          </Col>
        </Row>
      </div>
    </Spin>
  </Page>
</template>
