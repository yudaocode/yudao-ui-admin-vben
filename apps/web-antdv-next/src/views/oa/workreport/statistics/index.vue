<script lang="ts" setup>
import type { OaWorkReportApi } from '#/api/oa/workreport';
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Empty,
  Progress,
  DateRangePicker as RangePicker,
  Table,
  TabPane,
  Tabs,
} from 'antdv-next';
import dayjs from 'dayjs';

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
const reportDate = ref<[string | undefined, string | undefined]>(
  getDefaultReportDate(activeType.value),
); // 统计日期范围
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

/** 员工汇报统计的表格列 */
const userColumns: any[] = [
  { key: 'index', title: '序号', width: 60, align: 'center' },
  { key: 'userName', title: '员工', dataIndex: 'userName', align: 'center' },
  {
    key: 'deptName',
    title: '部门',
    dataIndex: 'deptName',
    align: 'center',
    ellipsis: true,
  },
  {
    key: 'expectedCount',
    title: '应填',
    dataIndex: 'expectedCount',
    align: 'center',
  },
  { key: 'submittedCount', title: '已填', align: 'center' },
  { key: 'missingCount', title: '未填', align: 'center' },
  { key: 'fillRate', title: '填写率', width: 160, align: 'center' },
];

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 获得默认统计日期范围：月报从年初开始，日报和周报从月初开始 */
function getDefaultReportDate(type: number): [string, string] {
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
    <DetailModal />

    <div class="flex h-full w-full gap-4">
      <!-- 左侧部门树 -->
      <Card class="h-full w-1/6 shrink-0">
        <DeptTreeSelect ref="deptTreeRef" @select="handleDeptSelect" />
      </Card>
      <!-- 右侧汇报统计 -->
      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <!-- 汇报类型与搜索工作栏 -->
        <Card>
          <Tabs v-model:active-key="activeTypeKey" @change="handleTypeChange">
            <TabPane
              v-for="item in statisticsTypeTabs"
              :key="String(item.key)"
              :tab="item.label"
            />
          </Tabs>
          <div class="flex items-center gap-2">
            <span class="shrink-0">统计周期</span>
            <RangePicker
              v-model:value="reportDate"
              class="w-[260px]"
              value-format="YYYY-MM-DD"
              :placeholder="['开始日期', '结束日期']"
            />
            <Button @click="handleQuery">
              <IconifyIcon class="mr-1" icon="lucide:search" />搜索
            </Button>
            <Button @click="handleReset">
              <IconifyIcon class="mr-1" icon="lucide:refresh-ccw" />重置
            </Button>
          </div>
        </Card>

        <Empty
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
          <Card>
            <Table
              :columns="userColumns"
              :data-source="statistics.users"
              :loading="loading"
              :pagination="false"
              row-key="userId"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'index'">
                  {{ index + 1 }}
                </template>
                <template v-else-if="column.key === 'submittedCount'">
                  <span
                    class="cursor-pointer text-green-500"
                    @click="openStatisticsDetail(record, 'submitted')"
                  >
                    {{ record.submittedCount }}
                  </span>
                </template>
                <template v-else-if="column.key === 'missingCount'">
                  <span
                    class="cursor-pointer"
                    :class="
                      record.missingCount ? 'text-red-500' : 'text-gray-400'
                    "
                    @click="openStatisticsDetail(record, 'missing')"
                  >
                    {{ record.missingCount }}
                  </span>
                </template>
                <template v-else-if="column.key === 'fillRate'">
                  <Progress
                    :percent="
                      calculateFillRate(
                        record.submittedCount,
                        record.expectedCount,
                      )
                    "
                    size="small"
                  />
                </template>
              </template>
            </Table>
          </Card>
        </template>
      </div>
    </div>
  </Page>
</template>
