<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';

import type { MallMemberStatisticsApi } from '#/api/mall/statistics/member'; // 会员统计数据

import { onMounted, ref } from 'vue';

import { AnalysisOverview, DocAlert, Page } from '@vben/common-ui';
import { SvgCakeIcon, SvgCardIcon } from '@vben/icons';

import * as MemberStatisticsApi from '#/api/mall/statistics/member'; // 会员统计数据
import MemberFunnelCard from '#/views/mall/home/components/member-funnel-card.vue';
import MemberTerminalCard from '#/views/mall/home/components/member-terminal-card.vue';

import MemberRegionCard from './components/member-region-card.vue';
import MemberSexCard from './components/member-sex-card.vue';

const summary = ref<MallMemberStatisticsApi.Summary>();

const overviewItems = ref<AnalysisOverviewItem[]>([]);
const loadOverview = async () => {
  summary.value = await MemberStatisticsApi.getMemberSummary();
  overviewItems.value = [
    {
      icon: SvgCakeIcon, // 自定义立体用户群组图标 - 累计会员数
      title: '累计会员数',
      value: summary.value?.userCount || 0,
    },
    {
      icon: SvgCardIcon, // 自定义立体信用卡图标 - 累计充值人数
      title: '累计充值人数',
      value: summary.value?.rechargeUserCount || 0,
    },
    {
      icon: SvgCardIcon, // 自定义立体钞票图标 - 累计充值金额
      title: '累计充值金额',
      value: summary.value?.rechargePrice || 0,
    },
    {
      icon: SvgCakeIcon, // 自定义立体用户添加图标 - 今日会员注册量
      title: '今日会员注册量',
      value: summary.value?.expensePrice || 0,
    },
  ];
};

onMounted(async () => {
  loadOverview();
});
</script>

<template>
  <Page>
    <DocAlert
      title="【统计】会员、商品、交易统计"
      url="https://doc.iocoder.cn/mall/statistics/"
    />
    <div class="mt-5 w-full md:flex">
      <AnalysisOverview
        v-model:model-value="overviewItems"
        class="mt-5 md:mr-4 md:mt-0 md:w-full"
      />
    </div>
    <div class="mb-4 mt-5 w-full md:flex">
      <MemberFunnelCard class="mt-5 md:mr-4 md:mt-0 md:w-2/3" />
      <MemberTerminalCard class="mt-5 md:mr-4 md:mt-0 md:w-1/3" />
    </div>
    <div class="mb-4 mt-5 w-full md:flex">
      <MemberRegionCard class="mt-5 md:mr-4 md:mt-0 md:w-2/3" />
      <MemberSexCard class="mt-5 md:mr-4 md:mt-0 md:w-1/3" />
    </div>
  </Page>
</template>
