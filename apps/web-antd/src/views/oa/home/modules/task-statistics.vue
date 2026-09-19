<script lang="ts" setup>
import type { EChartsOption, EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { DICT_TYPE } from '@vben/constants';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Button, Empty, Progress, Spin } from 'ant-design-vue';

import { getCompletedTaskRanking, getTaskStatusCount } from '#/api/oa/task';
import { DictTag } from '#/components/dict-tag';
import { OA_TASK_STATUS } from '#/views/oa/utils/constants';

import OaHomePanel from './panel.vue';

defineOptions({ name: 'OaHomeTaskStatistics' });

type TaskRanking = Awaited<ReturnType<typeof getCompletedTaskRanking>>[number];

const { push } = useRouter(); // 路由跳转
const loading = ref(false); // 区块加载中
const loadError = ref(false); // 区块加载失败
const rankingLoading = ref(false); // 排行加载中
const rankingError = ref(false); // 排行加载失败
const statusCountMap = ref<Record<number, number>>({}); // 状态与任务数量
const taskRankings = ref<TaskRanking[]>([]); // 任务完成排行
const taskStatuses = computed(() =>
  Object.values(OA_TASK_STATUS).map((status) => ({
    status,
    count: statusCountMap.value[status] || 0,
  })),
); // 补齐没有任务的状态
const taskTotal = computed(() =>
  taskStatuses.value.reduce((total, item) => total + item.count, 0),
); // 我的任务总数

const rankingOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 32, right: 16, top: 20, bottom: 50 },
  xAxis: {
    type: 'category',
    data: taskRankings.value.map((item) => item.userName || `用户 ${item.userId}`),
    axisLabel: { interval: 0, width: 60, overflow: 'truncate' },
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    {
      name: '已完成任务',
      type: 'bar',
      barMaxWidth: 36,
      data: taskRankings.value.map((item) => item.completedCount),
    },
  ],
})); // 按发布人统计已完成任务
const rankingChartRef = ref<EchartsUIType>(); // 完成排行图组件
const { renderEcharts } = useEcharts(rankingChartRef);

/** 获得任务状态占比 */
function getStatusPercentage(count: number) {
  return taskTotal.value === 0 ? 0 : Math.round((count / taskTotal.value) * 100);
}

/** 渲染任务完成排行图 */
async function renderRankingChart() {
  if (taskRankings.value.length === 0) return;
  await nextTick();
  await renderEcharts(rankingOptions.value);
}
watch(rankingOptions, renderRankingChart);

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return;
  loading.value = true;
  loadError.value = false;
  try {
    statusCountMap.value = await getTaskStatusCount();
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** 查询任务完成排行 */
async function getRankingList() {
  rankingLoading.value = true;
  rankingError.value = false;
  try {
    taskRankings.value = await getCompletedTaskRanking();
    await renderRankingChart();
  } catch {
    rankingError.value = true;
  } finally {
    rankingLoading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getList();
  getRankingList();
});
</script>

<template>
  <OaHomePanel title="任务完成情况">
    <template #actions>
      <Button type="link" @click="push('/oa/task/my')">查看任务</Button>
    </template>

    <!-- 我的任务状态 -->
    <Spin :spinning="loading" class="mb-5 block">
      <div v-if="loadError" class="mb-3 text-[13px] text-destructive">
        加载失败，
        <Button type="link" @click="getList">重新加载</Button>
      </div>
      <div class="mb-3 text-sm font-semibold">我的任务</div>
      <div
        v-for="item in taskStatuses"
        :key="item.status"
        class="flex min-h-[34px] items-center gap-2.5"
      >
        <span class="w-14 text-[13px]">
          <DictTag :type="DICT_TYPE.OA_TASK_STATUS" :value="item.status" />
        </span>
        <Progress
          class="flex-1"
          :percent="getStatusPercentage(item.count)"
          :show-info="false"
          :stroke-width="8"
        />
        <span class="w-7 text-right text-muted-foreground">
          {{ item.count }}
        </span>
      </div>
    </Spin>

    <!-- 任务完成排行独立加载，不等待状态统计 -->
    <Spin :spinning="rankingLoading">
      <div v-if="rankingError" class="mb-3 text-[13px] text-destructive">
        加载失败，
        <Button type="link" @click="getRankingList">重新加载</Button>
      </div>
      <div class="mb-3 text-sm font-semibold">任务完成排行（按发布人）</div>
      <Empty
        v-if="taskRankings.length === 0"
        :image-style="{ height: '60px' }"
        description="暂无完成记录"
      />
      <EchartsUI v-else ref="rankingChartRef" height="240px" />
    </Spin>
  </OaHomePanel>
</template>
