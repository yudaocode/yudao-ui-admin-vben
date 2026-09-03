<script lang="ts" setup>
import type { EChartsOption } from '@vben/plugins/echarts';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsIterationApi } from '#/api/pms/pm/iteration';
import type { PmsProjectApi } from '#/api/pms/pm/project';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { formatDateTime } from '@vben/utils';
import { getAllPageItems } from '@vben/utils';

import dayjs from 'dayjs';
import {
  ElButton,
  ElCard,
  ElCol,
  ElDescriptions,
  ElDescriptionsItem,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElMessage,
  ElProgress,
  ElRow,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  completeIteration,
  deleteIteration,
  getIteration,
  getIterationOverview,
} from '#/api/pms/pm/iteration';
import { getProject } from '#/api/pms/pm/project';
import { getWorkItemPage } from '#/api/pms/pm/workitem';
import IterationForm from '#/views/pms/pm/iteration/components/iteration-form.vue';
import IterationStartForm from '#/views/pms/pm/iteration/components/iteration-start-form.vue';
import {
  PmsIterationOverviewCardOptions,
  PmsIterationStatus,
  PmsProjectStatus,
  PmsProjectType,
  PmsWorkItemStatusType,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';
import {
  getIterationStatusTagType,
} from '#/views/pms/pm/utils/format';
import WorkItemAllList from '#/views/pms/pm/workitem/list/work-item-all-list.vue';
import WorkItemList from '#/views/pms/pm/workitem/list/work-item-list.vue';

import {
  getDistributionChartOptions,
  getStatusTrendChartOptions,
  useBurnDownColumns,
} from './data';

defineOptions({ name: 'PmsIterationDetail' });

// TODO @AI：antd/antdv-next 不要用 v-loading。工作项列表已用 VXE 的话，补 toolbarConfig；日期不要页面里 dayjs.format。

const { hasAccessByCodes } = useAccess();
const { push } = useRouter(); // 路由操作
const route = useRoute(); // 当前路由
const loading = ref(false); // 数据加载中
const activeTab = ref<'items' | 'overview'>('overview'); // 当前详情页签
const activeWorkItemTab = ref<'all' | 'defect' | 'requirement' | 'task'>('all'); // 当前事项类型页签
const iteration = ref<PmsIterationApi.Iteration>(); // 当前迭代
const project = ref<PmsProjectApi.Project>(); // 所属项目
const workItemList = ref<PmsWorkItemApi.WorkItem[]>([]); // 迭代事项列表
const editable = computed(() =>
  Boolean(
    project.value?.writeStatus &&
    project.value.status === PmsProjectStatus.ACTIVE,
  ),
); // 是否允许编辑迭代
const overview = ref<PmsIterationApi.IterationOverview>({
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  progress: 0,
  typeCountMap: {},
  typeStatusCountMap: {},
  statusTrends: [],
  burnDowns: [],
  recentActivities: [],
}); // 迭代概览
const cards = computed(() =>
  PmsIterationOverviewCardOptions.map((option) => ({
    label: option.label,
    value:
      overview.value[option.field as keyof PmsIterationApi.IterationOverview],
  })),
); // 状态统计卡片
const typeDistribution = computed(() =>
  getDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE, 'number').map((option) => ({
    type: option.value,
    name: option.label,
    count: overview.value.typeCountMap[option.value] || 0,
  })),
); // 事项类型分布
const distributionChartRef = ref<any>(); // 事项分布图
const statusTrendChartRef = ref<any>(); // 事项状态趋势图
const { renderEcharts: renderDistributionChart } = useEcharts(distributionChartRef);
const { renderEcharts: renderStatusTrendChart } = useEcharts(statusTrendChartRef);

const statusTrendChartOptions = computed<EChartsOption>(() =>
  getStatusTrendChartOptions(overview.value),
); // 近 14 天事项状态趋势
const distributionChartOptions = computed<EChartsOption>(() =>
  getDistributionChartOptions(overview.value, typeDistribution.value),
); // 事项类型和状态交叉分布
const statusDistribution = computed(() => {
  const statusCountMap: Record<number, number> = {
    [PmsWorkItemStatusType.PENDING]: overview.value.pendingCount,
    [PmsWorkItemStatusType.PROCESSING]: overview.value.processingCount,
    [PmsWorkItemStatusType.COMPLETED]: overview.value.completedCount,
  };
  return getDictOptions(DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE, 'number').map(
    (option) => ({
    name: option.label,
    count: statusCountMap[option.value] ?? 0,
    progressStatus:
      option.value === PmsWorkItemStatusType.COMPLETED
        ? ('success' as const)
        : undefined,
    }),
  );
}); // 当前状态分布
const teamNames = computed(() => {
  const names = new Set<string>();
  workItemList.value.forEach((item) => {
    if (item.assigneeUserName) names.add(item.assigneeUserName);
    item.memberUserNames?.forEach((name) => names.add(name));
  });
  return Array.from(names);
}); // 迭代参与成员

type BurnDown = PmsIterationApi.IterationOverview['burnDowns'][number];

const [BurnDownGrid, burnDownGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useBurnDownColumns(),
    height: 210,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = overview.value.burnDowns;
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      keyField: 'date',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<BurnDown>,
});

/** 加载迭代概览数据 */
async function loadData() {
  if (!iteration.value) {
    return;
  }
  loading.value = true;
  try {
    const currentIteration = iteration.value;
    // 并行加载页面所需数据
    const [currentOverview, currentWorkItems] = await Promise.all([
      getIterationOverview(currentIteration.id!),
      getAllPageItems<PmsWorkItemApi.WorkItem>((pageNo, pageSize) =>
        getWorkItemPage({
          pageNo,
          pageSize,
          projectId: currentIteration.projectId,
          iterationId: currentIteration.id,
        }),
      ),
    ]);
    overview.value = currentOverview;
    workItemList.value = currentWorkItems;
    // 同步刷新燃尽数据表格
    await burnDownGridApi.query();
  } finally {
    loading.value = false;
  }
}

/** 计算工作项类型占比 */
function getTypePercentage(count: number) {
  return overview.value.totalCount > 0
    ? Math.round((count * 100) / overview.value.totalCount)
    : 0;
}

const [IterationFormModal, iterationFormModalApi] = useVbenModal({
  connectedComponent: IterationForm,
});
const [IterationStartFormModal, iterationStartFormModalApi] = useVbenModal({
  connectedComponent: IterationStartForm,
});

/** 处理迭代更多操作 */
function handleIterationCommand(command: 'delete' | 'edit') {
  if (!iteration.value) {
    return;
  }
  if (command === 'edit') {
    iterationFormModalApi
      .setData({
        formType: 'update',
        id: iteration.value.id,
        projectId: iteration.value.projectId,
      })
      .open();
    return;
  }
  handleDelete();
}

/** 完成迭代 */
async function handleComplete() {
  if (!iteration.value) {
    return;
  }
  try {
    await confirm(`确认完成迭代“${iteration.value.name}”吗？`);
    await completeIteration(iteration.value.id!);
    ElMessage.success('迭代已完成');
    await handleIterationChanged();
  } catch {
  }
}

/** 删除迭代 */
async function handleDelete() {
  if (!iteration.value) {
    return;
  }
  try {
    await confirm(`确认删除迭代“${iteration.value.name}”吗？`);
    await deleteIteration(iteration.value.id!);
    ElMessage.success('删除成功');
    close();
  } catch {
  }
}

/** 刷新迭代详情和概览 */
async function handleIterationChanged() {
  if (!iteration.value?.id) {
    return;
  }
  iteration.value = await getIteration(iteration.value.id);
  await loadData();
}

/** 返回所属项目的迭代列表 */
function close() {
  if (!iteration.value) {
    return;
  }
  push({
    name: 'PmsProjectDetail',
    params: { id: iteration.value.projectId },
    query: { tabs: 'iteration' },
  });
}

/** 初始化 */
watch(distributionChartOptions, (options) => renderDistributionChart(options));
watch(statusTrendChartOptions, (options) => renderStatusTrendChart(options));
onMounted(() => {
  renderDistributionChart(distributionChartOptions.value);
  renderStatusTrendChart(statusTrendChartOptions.value);
});

onMounted(async () => {
  loading.value = true;
  try {
    // 1. 查询迭代及所属项目
    iteration.value = await getIteration(Number(route.params.id));
    project.value = await getProject(iteration.value.projectId);
    // 2. 加载迭代统计和事项
    await loadData();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="p-4">
      <!-- 迭代详情标题 -->
      <div class="mb-4 flex items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <ElButton circle @click="close">
            <IconifyIcon icon="ep:arrow-left" />
          </ElButton>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="m-0 truncate text-xl font-semibold">
                {{ iteration?.name || '迭代详情' }}
              </h2>
              <ElTag
                v-if="iteration"
                :type="getIterationStatusTagType(iteration.status)"
              >
                {{ getDictLabel(DICT_TYPE.PMS_ITERATION_STATUS, iteration.status) || '-' }}
              </ElTag>
            </div>
            <div class="mt-1 text-[13px] text-[var(--el-text-color-secondary)]">
              {{ iteration?.target || '暂无迭代目标' }}
            </div>
          </div>
        </div>
        <div
          v-if="iteration && editable"
          class="flex shrink-0 items-center gap-2"
        >
          <ElButton
            v-if="
              iteration.status === PmsIterationStatus.PLANNED &&
              hasAccessByCodes(['pms:pm:iteration:update'])
            "
            type="primary"
            @click="iterationStartFormModalApi.setData(iteration).open()"
          >
            开始迭代
          </ElButton>
          <ElButton
            v-if="
              iteration.status === PmsIterationStatus.ACTIVE &&
              hasAccessByCodes(['pms:pm:iteration:update'])
            "
            type="primary"
            @click="handleComplete"
          >
            完成迭代
          </ElButton>
          <ElDropdown trigger="click" @command="handleIterationCommand">
            <ElButton aria-label="更多操作">
              <IconifyIcon icon="ep:more-filled" />
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem
                  v-if="hasAccessByCodes(['pms:pm:iteration:update'])"
                  command="edit"
                >
                  编辑迭代
                </ElDropdownItem>
                <ElDropdownItem
                  v-if="hasAccessByCodes(['pms:pm:iteration:delete'])"
                  command="delete"
                  divided
                >
                  删除迭代
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>
      </div>

      <!-- 迭代概览与事项 -->
      <div v-if="iteration">
        <ElTabs v-model="activeTab">
          <ElTabPane label="概览" name="overview">
            <!-- 迭代核心指标 -->
            <ElRow :gutter="12">
              <ElCol v-for="card in cards" :key="card.label" :span="6">
                <ElCard shadow="never">
                  <div
                    class="text-[13px] text-[var(--el-text-color-secondary)]"
                  >
                    {{ card.label }}
                  </div>
                  <div class="mt-2 text-2xl font-semibold">
                    {{ card.value }}
                  </div>
                </ElCard>
              </ElCol>
            </ElRow>
            <div class="my-4">
              <div class="mb-2 flex justify-between">
                <span>迭代进度</span><span>{{ overview.progress }}%</span>
              </div>
              <ElProgress :percentage="overview.progress" :stroke-width="12" />
            </div>
            <!-- 迭代信息与事项类型分布 -->
            <ElRow :gutter="16">
              <ElCol :span="12">
                <ElCard header="迭代信息" shadow="never">
                  <ElDescriptions :column="2" border>
                    <ElDescriptionsItem label="状态">
                      {{ getDictLabel(DICT_TYPE.PMS_ITERATION_STATUS, iteration?.status) || '-' }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="负责人">
                      {{ iteration?.ownerUserName || '未设置' }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="开始时间">
                      {{
                        iteration?.startTime
                          ? dayjs(iteration.startTime).format('YYYY-MM-DD')
                          : '--'
                      }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="结束时间">
                      {{
                        iteration?.endTime
                          ? dayjs(iteration.endTime).format('YYYY-MM-DD')
                          : '--'
                      }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="迭代目标" :span="2">
                      {{ iteration?.target || '未设置' }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="参与成员" :span="2">
                      {{ teamNames.join('、') || '暂无参与成员' }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="迭代描述" :span="2">
                      {{ iteration?.description || '暂无描述' }}
                    </ElDescriptionsItem>
                  </ElDescriptions>
                </ElCard>
              </ElCol>
              <ElCol :span="12">
                <ElCard header="事项分布" shadow="never">
                  <EchartsUI ref="distributionChartRef" height="220px" />
                </ElCard>
              </ElCol>
            </ElRow>
            <!-- 状态趋势与燃尽数据 -->
            <ElRow class="mt-4" :gutter="16">
              <ElCol :span="12">
                <ElCard header="事项状态趋势" shadow="never">
                  <EchartsUI ref="statusTrendChartRef" height="210px" />
                </ElCard>
              </ElCol>
              <ElCol :span="12">
                <ElCard header="燃尽数据" shadow="never">
                  <BurnDownGrid />
                </ElCard>
              </ElCol>
            </ElRow>
            <!-- 状态分布与最近活动 -->
            <ElRow class="mt-4 items-stretch" :gutter="16">
              <ElCol class="!flex" :span="12">
                <ElCard
                  class="h-full w-full"
                  header="当前状态分布"
                  shadow="never"
                >
                  <div
                    v-for="item in statusDistribution"
                    :key="item.name"
                    class="flex min-h-[56px] items-center gap-3"
                  >
                    <span class="!w-14">{{ item.name }}</span>
                    <ElProgress
                      class="flex-1"
                      :percentage="getTypePercentage(item.count)"
                      :status="item.progressStatus"
                      :stroke-width="12"
                    />
                    <strong class="w-7 text-right">{{ item.count }}</strong>
                  </div>
                </ElCard>
              </ElCol>
              <ElCol class="!flex" :span="12">
                <ElCard class="h-full w-full" header="最近活动" shadow="never">
                  <ElEmpty
                    v-if="overview.recentActivities.length === 0"
                    :image-size="60"
                    description="暂无活动"
                  />
                  <ElTimeline v-else class="max-h-[260px] overflow-y-auto pr-2">
                    <ElTimelineItem
                      v-for="activity in overview.recentActivities"
                      :key="activity.id"
                      :timestamp="formatDateTime(activity.createTime)"
                    >
                      <div>
                        <strong>{{
                          activity.operatorUserName || '系统'
                        }}</strong>
                        {{ activity.content }}
                      </div>
                      <div
                        class="mt-1 text-xs text-[var(--el-text-color-secondary)]"
                      >
                        #{{ activity.workItemSerialNumber }}
                        {{ activity.workItemName }}
                      </div>
                    </ElTimelineItem>
                  </ElTimeline>
                </ElCard>
              </ElCol>
            </ElRow>
          </ElTabPane>
          <!-- 迭代事项 -->
          <ElTabPane :label="`事项（${workItemList.length}）`" name="items">
            <ElTabs v-model="activeWorkItemTab" type="card">
              <ElTabPane label="全部" lazy name="all">
                <WorkItemAllList
                  :editable="editable"
                  :iteration-id="iteration.id"
                  :project-id="iteration.projectId"
                  :project-type="project?.type || PmsProjectType.AGILE"
                  @changed="loadData"
                />
              </ElTabPane>
              <ElTabPane label="需求" lazy name="requirement">
                <WorkItemList
                  default-view-mode="board"
                  :editable="editable"
                  :iteration-id="iteration.id"
                  :project-id="iteration.projectId"
                  :project-type="project?.type || PmsProjectType.AGILE"
                  :type="PmsWorkItemType.REQUIREMENT"
                  @changed="loadData"
                />
              </ElTabPane>
              <ElTabPane label="任务" lazy name="task">
                <WorkItemList
                  default-view-mode="board"
                  :editable="editable"
                  :iteration-id="iteration.id"
                  :project-id="iteration.projectId"
                  :project-type="project?.type || PmsProjectType.AGILE"
                  :type="PmsWorkItemType.TASK"
                  @changed="loadData"
                />
              </ElTabPane>
              <ElTabPane label="缺陷" lazy name="defect">
                <WorkItemList
                  default-view-mode="board"
                  :editable="editable"
                  :iteration-id="iteration.id"
                  :project-id="iteration.projectId"
                  :project-type="project?.type || PmsProjectType.AGILE"
                  :type="PmsWorkItemType.DEFECT"
                  @changed="loadData"
                />
              </ElTabPane>
            </ElTabs>
          </ElTabPane>
        </ElTabs>
      </div>
    </div>
    <!-- 迭代编辑和开始弹窗 -->
    <IterationFormModal @success="handleIterationChanged" />
    <IterationStartFormModal @success="handleIterationChanged" />
  </Page>
</template>
