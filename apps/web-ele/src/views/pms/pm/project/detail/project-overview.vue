<script lang="ts" setup>
import type { EChartsOption } from '@vben/plugins/echarts';

import type { PmsIterationApi } from '#/api/pms/pm/iteration';
import type { PmsProjectApi } from '#/api/pms/pm/project';
import type { PmsProjectAnnouncementApi } from '#/api/pms/pm/project/announcement';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenDrawer } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';
import { getAllPageItems } from '@vben/utils';

import dayjs from 'dayjs';
import {
  ElAvatar,
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElProgress,
  ElTag,
} from 'element-plus';

import { getIterationPage } from '#/api/pms/pm/iteration';
import { getProjectOverview } from '#/api/pms/pm/project';
import { getProjectAnnouncementList } from '#/api/pms/pm/project/announcement';
import {
  PmsIterationStatus,
  PmsProjectType,
} from '#/views/pms/pm/utils/constants';
import {
  formatProjectCompletionRate,
  getIterationStatusTagType,
} from '#/views/pms/pm/utils/format';
import WorkItemDetail from '#/views/pms/pm/workitem/detail/work-item-detail.vue';

defineOptions({ name: 'PmsProjectOverview' });

// TODO @AI：antd/antdv-next 不要用 v-loading。日期用 formatDateTime，不要页面里 dayjs.format。
// TODO @AI：概况只展示未完成迭代和最新公告，却分页拉取全部迭代/公告后再 filter[0]；应补后端状态/limit 查询或聚合接口，避免项目数据增长后首屏请求无界膨胀。
// TODO @AI：trendChartRef 使用 ref<any>，应对齐 CRM/system 的 EchartsUIType 实例类型，避免模板 ref 和图表调用失去类型约束。

const props = defineProps<{
  editable: boolean;
  project: PmsProjectApi.Project;
}>();

const { push } = useRouter(); // 路由操作
const loading = ref(false); // 项目概况加载中
const announcements = ref<PmsProjectAnnouncementApi.ProjectAnnouncement[]>([]); // 项目公告
const iterations = ref<PmsIterationApi.Iteration[]>([]); // 敏捷项目未完成迭代
const overview = ref<PmsProjectApi.ProjectOverview>({
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  typeCountMap: {},
  completedTrends: [],
  assignedWorkItems: [],
}); // 项目概况
const latestAnnouncement = computed(() => announcements.value[0]); // 最新项目公告
const isAgileProject = computed(
  () => props.project.type === PmsProjectType.AGILE,
);
const trendChartRef = ref<any>(); // 工作项趋势图
const { renderEcharts: renderTrendChart } = useEcharts(trendChartRef);

const trendChartOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0, data: ['工作项数量'] },
  grid: { top: 44, right: 18, bottom: 14, left: 12, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: overview.value.completedTrends.map((point) => point.date.slice(5)),
    axisTick: { show: false },
  },
  yAxis: { type: 'value', minInterval: 1, axisTick: { show: false } },
  series: [
    {
      name: '工作项数量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: overview.value.completedTrends.map((point) => point.count),
      lineStyle: { width: 2, color: '#409eff' },
      itemStyle: { color: '#409eff' },
    },
  ],
})); // 近 14 日完成工作项折线图

const [WorkItemDetailDrawer, workItemDetailDrawerApi] = useVbenDrawer({
  connectedComponent: WorkItemDetail,
});

/** 查询项目概况 */
async function getOverview() {
  loading.value = true;
  try {
    // 并行加载页面所需数据
    const iterationPromise = isAgileProject.value
      ? getAllPageItems<PmsIterationApi.Iteration>((pageNo, pageSize) =>
          getIterationPage({ pageNo, pageSize, projectId: props.project.id }),
        )
      : Promise.resolve([] as PmsIterationApi.Iteration[]);
    const [currentOverview, currentAnnouncements, currentIterations] =
      await Promise.all([
        getProjectOverview(props.project.id),
        getProjectAnnouncementList(props.project.id),
        iterationPromise,
      ]);
    overview.value = currentOverview;
    announcements.value = currentAnnouncements;
    iterations.value = currentIterations.filter(
      (iteration) => iteration.status !== PmsIterationStatus.COMPLETED,
    );
  } finally {
    loading.value = false;
  }
}

/** 打开项目公告配置 */
function openAnnouncementConfig() {
  push({
    name: 'PmsProjectConfig',
    params: {
      id: props.project.id,
    },
    query: {
      tabs: 'announcement',
    },
  });
}

/** 进入当前项目的全部事项并筛选当前用户负责的事项 */
function openAssignedWorkItems() {
  push({
    name: 'PmsProjectDetail',
    params: { id: props.project.id },
    query: {
      tabs: isAgileProject.value ? 'all' : 'task',
      assigneeUserId: String(useUserStore().userInfo?.id),
    },
  });
}

/** 打开工作项详情 */
function openWorkItem(id: number) {
  workItemDetailDrawerApi.setData({ id }).open();
}

/** 进入项目迭代列表 */
function openIterationList() {
  push({
    name: 'PmsProjectDetail',
    params: { id: props.project.id },
    query: { tabs: 'iteration' },
  });
}

/** 进入迭代详情 */
function openIteration(iteration: PmsIterationApi.Iteration) {
  if (!iteration.id) {
    return;
  }
  push({ name: 'PmsIterationDetail', params: { id: iteration.id } });
}

/** 初始化 */
watch(trendChartOptions, (options) => renderTrendChart(options));
onMounted(() => renderTrendChart(trendChartOptions.value));

onMounted(() => {
  getOverview();
});
</script>

<template>
  <!-- 项目一览：统一布局和信息层级 -->
  <div
    v-loading="loading"
    class="grid grid-cols-2 gap-4 max-[1200px]:grid-cols-1"
  >
    <!-- 项目公告 -->
    <ElCard class="min-h-[300px]" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold">项目公告</span>
          <ElButton
            v-if="editable"
            link
            type="primary"
            @click="openAnnouncementConfig"
          >
            <IconifyIcon icon="ep:plus" />新建公告
          </ElButton>
        </div>
      </template>
      <ElEmpty
        v-if="!latestAnnouncement"
        :image-size="64"
        description="暂无公告"
      />
      <template v-else>
        <div class="min-h-[178px] rounded bg-[var(--el-fill-color-light)] p-4">
          <div class="flex items-center gap-3">
            <ElAvatar :size="40">
              {{ latestAnnouncement.creatorUserName?.slice(0, 1) || '-' }}
            </ElAvatar>
            <div>
              <div class="font-semibold">
                {{ latestAnnouncement.creatorUserName || '-' }}
              </div>
              <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
                发布于 {{ formatDateTime(latestAnnouncement.createTime) }}
              </div>
            </div>
          </div>
          <div class="mt-4 line-clamp-4 whitespace-pre-wrap leading-6">
            {{ latestAnnouncement.content }}
          </div>
        </div>
        <ElButton
          class="mt-3"
          link
          type="primary"
          @click="openAnnouncementConfig"
        >
          查看全部公告
        </ElButton>
      </template>
    </ElCard>

    <!-- 敏捷项目迭代；通用项目展示工作项趋势 -->
    <ElCard v-if="isAgileProject" class="min-h-[300px]" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-semibold">项目迭代</span>
            <span class="text-xs text-[var(--el-text-color-secondary)]">
              共 {{ iterations.length }} 个未完成迭代
            </span>
          </div>
          <ElButton link type="primary" @click="openIterationList">
查看更多
</ElButton>
        </div>
      </template>
      <ElEmpty
        v-if="iterations.length === 0"
        :image-size="64"
        description="暂无未完成迭代"
      />
      <div v-else class="max-h-[220px] overflow-y-auto">
        <div
          v-for="iteration in iterations"
          :key="iteration.id"
          class="cursor-pointer rounded border-0 border-b border-solid border-[var(--el-border-color-lighter)] p-2.5 last:border-b-0 hover:bg-[var(--el-fill-color-light)]"
          @click="openIteration(iteration)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="truncate font-medium">{{ iteration.name }}</span>
            <ElTag
              :type="getIterationStatusTagType(iteration.status)"
              size="small"
            >
              {{ getDictLabel(DICT_TYPE.PMS_ITERATION_STATUS, iteration.status) || '-' }}
            </ElTag>
          </div>
          <div
            class="mt-1.5 flex items-center gap-2.5 text-xs text-[var(--el-text-color-secondary)]"
          >
            <span>
              {{
                iteration.startTime
                  ? dayjs(iteration.startTime).format('YYYY-MM-DD')
                  : '--'
              }}
              至
              {{
                iteration.endTime
                  ? dayjs(iteration.endTime).format('YYYY-MM-DD')
                  : '--'
              }}
            </span>
            <span v-if="iteration.progress !== undefined">
              完成 {{ iteration.progress }}%
            </span>
          </div>
          <ElProgress
            class="mt-1.5"
            :percentage="iteration.progress || 0"
            :stroke-width="6"
            :show-text="false"
          />
        </div>
      </div>
    </ElCard>
    <ElCard v-else class="min-h-[300px]" shadow="never">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="font-semibold">工作项趋势</span>
          <span class="text-xs text-[var(--el-text-color-secondary)]">近 14 日已完成</span>
        </div>
      </template>
      <EchartsUI ref="trendChartRef" height="220px" />
    </ElCard>

    <!-- 项目基本信息 -->
    <ElCard class="min-h-[300px]" shadow="never">
      <template #header>
        <span class="font-semibold">项目基本信息</span>
      </template>
      <ElDescriptions :column="2">
        <ElDescriptionsItem label="项目名称" :span="2">
          {{ project.name }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="项目周期" :span="2">
          {{
            project.startTime
              ? dayjs(project.startTime).format('YYYY-MM-DD')
              : '未设置'
          }}
          至
          {{
            project.endTime
              ? dayjs(project.endTime).format('YYYY-MM-DD')
              : '未设置'
          }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="项目管理员">
          {{ project.adminNames.join('、') || '未设置' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="项目成员">
          {{ project.memberCount }} 人
        </ElDescriptionsItem>
        <ElDescriptionsItem label="项目进度" :span="2">
          <ElProgress
            :percentage="formatProjectCompletionRate(project)"
            :stroke-width="8"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="项目描述" :span="2">
          {{ project.description || '暂无项目描述' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>

    <!-- 分配给我的 -->
    <ElCard class="min-h-[300px]" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold">分配给我的</span>
          <ElButton link type="primary" @click="openAssignedWorkItems">
查看更多
</ElButton>
        </div>
      </template>
      <ElEmpty
        v-if="overview.assignedWorkItems.length === 0"
        description="暂无工作项"
        :image-size="64"
      />
      <div
        v-for="item in overview.assignedWorkItems.slice(0, 5)"
        :key="item.id"
        class="flex cursor-pointer items-center gap-2 border-0 border-b border-solid border-[var(--el-border-color-lighter)] py-2.5 last:border-b-0"
        @click="openWorkItem(item.id)"
      >
        <div class="min-w-0 flex-1">
          <div class="truncate">{{ item.name }}</div>
          <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
            #{{ item.serialNumber }} ·
            {{ getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, item.type) || '-' }}
          </div>
        </div>
        <ElProgress
          :percentage="item.progress"
          :show-text="false"
          :stroke-width="6"
        />
      </div>
    </ElCard>
  </div>
  <!-- 工作项详情 -->
  <WorkItemDetailDrawer @success="getOverview" />
</template>
