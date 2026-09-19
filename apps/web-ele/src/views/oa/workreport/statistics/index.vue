<script lang="ts" setup>
import type { OaWorkReportApi } from '#/api/oa/workreport';
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, onMounted, reactive, ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';
import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElEmpty,
  ElProgress,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { getWorkReportStatistics } from '#/api/oa/workreport';
import { OA_WORK_REPORT_TYPE } from '#/views/oa/utils/constants';
import { DeptTreeSelect } from '#/views/system/dept/components';

import Detail from './modules/detail.vue';

defineOptions({ name: 'OaWorkReportStatistics' });

/** 汇报类型页签 */
const statisticsTypeTabs = [
  { key: OA_WORK_REPORT_TYPE.DAILY, label: '日报' },
  { key: OA_WORK_REPORT_TYPE.WEEKLY, label: '周报' },
  { key: OA_WORK_REPORT_TYPE.MONTHLY, label: '月报' },
];

const loading = ref(false); // 统计加载中
const activeType = ref<number>(OA_WORK_REPORT_TYPE.DAILY); // 当前汇报类型
// Tabs 的 key 为字符串，通过代理同步数值类型
const activeTypeKey = computed({
  get: () => String(activeType.value),
  set: (value) => {
    activeType.value = Number(value);
  },
});
const deptTreeRef = ref<InstanceType<typeof DeptTreeSelect>>(); // 部门树 Ref
const reportDate = ref<string[]>(getDefaultReportDate(activeType.value)); // 统计日期范围
const queryParams = reactive<OaWorkReportApi.StatisticsReq>({
  type: OA_WORK_REPORT_TYPE.DAILY,
  startTime: '',
  endTime: '',
  queryStartTime: '',
  queryEndTime: '',
  deptId: undefined,
}); // 查询参数
const statistics = ref<OaWorkReportApi.Statistics>({
  userCount: 0,
  expectedCount: 0,
  submittedCount: 0,
  missingCount: 0,
  users: [],
}); // 汇报统计

/** 汇报统计概览卡片 */
const overviewCards = computed(() => [
  {
    title: '统计人数',
    value: statistics.value.userCount,
    unit: '人',
    icon: 'lucide:user',
    color: 'text-blue-500',
  },
  {
    title: '应填汇报',
    value: statistics.value.expectedCount,
    unit: '份',
    icon: 'lucide:file-text',
    color: 'text-orange-500',
  },
  {
    title: '已填汇报',
    value: statistics.value.submittedCount,
    unit: '份',
    icon: 'lucide:circle-check',
    color: 'text-green-500',
  },
  {
    title: '未填汇报',
    value: statistics.value.missingCount,
    unit: '份',
    icon: 'lucide:clock',
    color: 'text-red-500',
  },
  {
    title: '整体填写率',
    value: calculateFillRate(
      statistics.value.submittedCount,
      statistics.value.expectedCount,
    ),
    unit: '%',
    icon: 'lucide:pie-chart',
    color: 'text-purple-500',
  },
]);

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 获得默认统计日期范围：月报从年初开始，日报和周报从月初开始 */
function getDefaultReportDate(type: number): string[] {
  const currentTime = dayjs();
  return [
    currentTime
      .startOf(type === OA_WORK_REPORT_TYPE.MONTHLY ? 'year' : 'month')
      .format('YYYY-MM-DD'),
    currentTime.format('YYYY-MM-DD'),
  ];
}

/** 计算填写率，四舍五入保留一位小数 */
function calculateFillRate(submittedCount: number, expectedCount: number) {
  if (expectedCount === 0) {
    return 0;
  }
  return Math.round((submittedCount * 1000) / expectedCount) / 10;
}

/** 查询工作汇报统计 */
async function getStatistics() {
  if (!queryParams.deptId || !reportDate.value?.length) return;
  loading.value = true;
  try {
    // 1.1 设置统计时间范围，包含首日零点和末日最后一秒
    queryParams.startTime = dayjs(reportDate.value[0])
      .startOf('day')
      .format('YYYY-MM-DD HH:mm:ss');
    queryParams.endTime = dayjs(reportDate.value[1])
      .endOf('day')
      .format('YYYY-MM-DD HH:mm:ss');
    // 1.2 设置完整周期的查询范围，避免统计从周中、月中开始时漏掉汇报
    let queryStartTime = dayjs(queryParams.startTime);
    let queryEndTime = dayjs(queryParams.endTime);
    if (queryParams.type === OA_WORK_REPORT_TYPE.WEEKLY) {
      queryStartTime = queryStartTime.subtract(
        (queryStartTime.day() + 6) % 7,
        'day',
      );
      queryEndTime = queryEndTime.add((7 - queryEndTime.day()) % 7, 'day');
    } else if (queryParams.type === OA_WORK_REPORT_TYPE.MONTHLY) {
      queryStartTime = queryStartTime.startOf('month');
      queryEndTime = queryEndTime.endOf('month');
    }
    queryParams.queryStartTime = queryStartTime
      .startOf('day')
      .format('YYYY-MM-DD HH:mm:ss');
    queryParams.queryEndTime = queryEndTime
      .endOf('day')
      .format('YYYY-MM-DD HH:mm:ss');

    // 2. 查询并更新工作汇报统计结果
    statistics.value = await getWorkReportStatistics(queryParams);
  } finally {
    loading.value = false;
  }
}

/** 切换汇报类型 */
function handleTypeChange(key: number | string) {
  queryParams.type = Number(key);
  activeType.value = Number(key);
  reportDate.value = getDefaultReportDate(queryParams.type);
  getStatistics();
}

/** 搜索按钮操作 */
function handleQuery() {
  getStatistics();
}

/** 重置按钮操作 */
function handleReset() {
  reportDate.value = getDefaultReportDate(activeType.value);
  queryParams.deptId = undefined;
  deptTreeRef.value?.reset();
  getStatistics();
}

/** 选择部门 */
function handleDeptSelect(dept?: SystemDeptApi.Dept) {
  queryParams.deptId = dept?.id;
  getStatistics();
}

/** 打开员工汇报明细 */
function openStatisticsDetail(
  user: OaWorkReportApi.UserStatistics,
  tab: string,
) {
  detailModalApi
    .setData({ user, tab, queryParams: { ...queryParams } })
    .open();
}

/** 初始化 */
onMounted(() => {
  getStatistics();
});
</script>

<template>
  <Page>
    <DocAlert title="【协作】日程、任务、计划与汇报" url="https://doc.iocoder.cn/oa/collaboration/work/" />
    <DetailModal />

    <div class="flex h-full w-full gap-4">
      <!-- 左侧部门树 -->
      <ElCard class="h-full w-1/6 shrink-0">
        <DeptTreeSelect ref="deptTreeRef" @select="handleDeptSelect" />
      </ElCard>
      <!-- 右侧汇报统计 -->
      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <!-- 汇报类型与搜索工作栏 -->
        <ElCard>
          <ElTabs v-model="activeTypeKey" @tab-change="handleTypeChange">
            <ElTabPane
              v-for="item in statisticsTypeTabs"
              :key="item.key"
              :name="String(item.key)"
              :label="item.label"
            />
          </ElTabs>
          <div class="flex items-center gap-2">
            <span class="shrink-0">统计周期</span>
            <ElDatePicker
              v-model="reportDate"
              class="!w-[260px]"
              type="daterange"
              value-format="YYYY-MM-DD"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
            <ElButton @click="handleQuery">
              <IconifyIcon class="mr-1" icon="lucide:search" />搜索
            </ElButton>
            <ElButton @click="handleReset">
              <IconifyIcon class="mr-1" icon="lucide:refresh-ccw" />重置
            </ElButton>
          </div>
        </ElCard>

        <ElEmpty
          v-if="!queryParams.deptId"
          description="请选择部门查看汇报统计"
        />
        <template v-else>
          <!-- 汇报统计概览 -->
          <div class="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <div
              v-for="card in overviewCards"
              :key="card.title"
              class="bg-card border-border flex items-center justify-between rounded-md border px-4 py-3 shadow-sm"
            >
              <div>
                <div class="text-muted-foreground text-sm">{{ card.title }}</div>
                <div
                  class="mt-1 text-[22px] font-semibold leading-7"
                  :class="card.color"
                >
                  {{ card.value }} {{ card.unit }}
                </div>
              </div>
              <div
                class="bg-muted flex h-9 w-9 items-center justify-center rounded-lg"
              >
                <IconifyIcon
                  :icon="card.icon"
                  class="size-5"
                  :class="card.color"
                />
              </div>
            </div>
          </div>

          <!-- 员工汇报统计 -->
          <ElCard>
            <ElTable v-loading="loading" :data="statistics.users">
              <ElTableColumn
                type="index"
                label="序号"
                width="60"
                align="center"
              />
              <ElTableColumn
                label="员工"
                prop="userName"
                min-width="120"
                align="center"
              />
              <ElTableColumn
                label="部门"
                prop="deptName"
                min-width="120"
                align="center"
                show-overflow-tooltip
              />
              <ElTableColumn
                label="应填"
                prop="expectedCount"
                min-width="100"
                align="center"
              />
              <ElTableColumn label="已填" min-width="100" align="center">
                <template #default="{ row }">
                  <span
                    class="cursor-pointer text-green-500"
                    @click="
                      openStatisticsDetail(
                        row as OaWorkReportApi.UserStatistics,
                        'submitted',
                      )
                    "
                  >
                    {{ row.submittedCount }}
                  </span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="未填" min-width="100" align="center">
                <template #default="{ row }">
                  <span
                    class="cursor-pointer"
                    :class="row.missingCount ? 'text-red-500' : 'text-gray-400'"
                    @click="
                      openStatisticsDetail(
                        row as OaWorkReportApi.UserStatistics,
                        'missing',
                      )
                    "
                  >
                    {{ row.missingCount }}
                  </span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="填写率" min-width="160" align="center">
                <template #default="{ row }">
                  <ElProgress
                    :percentage="
                      calculateFillRate(row.submittedCount, row.expectedCount)
                    "
                  />
                </template>
              </ElTableColumn>
            </ElTable>
          </ElCard>
        </template>
      </div>
    </div>
  </Page>
</template>
