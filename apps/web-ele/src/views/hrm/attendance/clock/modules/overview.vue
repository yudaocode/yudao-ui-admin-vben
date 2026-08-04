<script lang="ts" setup>
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { computed, onMounted, ref } from 'vue';

import { confirm, useVbenForm } from '@vben/common-ui';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import dayjs from 'dayjs';
import {
  ElButton,
  ElCard,
  ElPagination,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  exportAttendanceMonthDailyOverview,
  getAttendanceMonthDailyOverviewPage,
} from '#/api/hrm/attendance/statistics';
import { getHrmOverviewTextClass } from '#/views/hrm/utils/format';

import { buildOverviewQueryParams, useOverviewFormSchema } from '../data';
import DailyDetail from './daily-detail.vue';

defineOptions({ name: 'HrmAttendanceClockOverview' });

const loading = ref(false);
const exportLoading = ref(false);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(10);
const list = ref<HrmAttendanceStatisticsApi.MonthDailyOverview[]>([]);
const queryMonth = ref(formatDate(new Date(), 'YYYY-MM'));

const [QueryForm, queryFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    labelWidth: 68,
  },
  layout: 'horizontal',
  schema: useOverviewFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
});

const dailyDetailRef = ref<InstanceType<typeof DailyDetail>>();

const dayColumns = computed(() => {
  const month = dayjs(queryMonth.value);
  return Array.from({ length: month.daysInMonth() }, (_, index) => {
    const date = month.date(index + 1);
    return {
      date: formatDate(date, 'YYYY-MM-DD'),
      day: formatDate(date, 'DD'),
      week: `周${'日一二三四五六'[date.day()]}`,
    };
  });
});

async function getList() {
  loading.value = true;
  try {
    const formValues = await queryFormApi.getValues();
    queryMonth.value = String(
      formValues.month || formatDate(new Date(), 'YYYY-MM'),
    );
    const data = await getAttendanceMonthDailyOverviewPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      ...buildOverviewQueryParams(formValues),
    });
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  pageNo.value = 1;
  getList();
}

async function handleReset() {
  await queryFormApi.resetForm();
  await queryFormApi.setValues({
    month: formatDate(new Date(), 'YYYY-MM'),
  });
  handleQuery();
}

async function handleExport() {
  try {
    await confirm({
      content: '确认导出当前筛选条件下的打卡概况吗？',
      title: '导出确认',
    });
    exportLoading.value = true;
    const formValues = await queryFormApi.getValues();
    const data = await exportAttendanceMonthDailyOverview(
      buildOverviewQueryParams(formValues) as Parameters<
        typeof exportAttendanceMonthDailyOverview
      >[0],
    );
    downloadFileFromBlobPart({
      fileName: '员工月度打卡概况.xls',
      source: data,
    });
  } catch {
  } finally {
    exportLoading.value = false;
  }
}

function openDailyDetail(
  row: HrmAttendanceStatisticsApi.MonthDailyOverview,
  attendanceDate: string,
) {
  dailyDetailRef.value?.open(row.employeeId, attendanceDate);
}

function handlePageChange(page: number) {
  pageNo.value = page;
  getList();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  pageNo.value = 1;
  getList();
}

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <DailyDetail ref="dailyDetailRef" />

    <ElCard shadow="never">
      <QueryForm />
      <div class="mt-2 flex flex-wrap gap-2">
        <ElButton type="primary" @click="handleQuery">搜索</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
        <ElButton
          v-access:code="['hrm:attendance:clock:export']"
          :loading="exportLoading"
          @click="handleExport"
        >
          导出
        </ElButton>
      </div>
    </ElCard>

    <ElCard shadow="never">
      <ElTable
        v-loading="loading"
        :data="list"
        border
        row-key="employeeId"
        size="small"
      >
        <ElTableColumn
          fixed="left"
          label="员工"
          prop="employeeName"
          show-overflow-tooltip
          width="120"
        />
        <ElTableColumn
          fixed="left"
          label="工号"
          prop="jobNumber"
          show-overflow-tooltip
          width="120"
        />
        <ElTableColumn
          fixed="left"
          label="部门"
          prop="deptName"
          show-overflow-tooltip
          width="140"
        />
        <ElTableColumn
          fixed="left"
          label="岗位"
          prop="postName"
          show-overflow-tooltip
          width="140"
        />
        <ElTableColumn
          v-for="day in dayColumns"
          :key="day.date"
          :label="`${day.day}\n${day.week}`"
          align="center"
          min-width="168"
        >
          <template #default="{ row }">
            <ElButton
              v-if="row.dailyClockMap?.[day.date]"
              class="!h-auto min-h-[52px] w-full !justify-start whitespace-normal !px-2 !py-1.5 text-left"
              link
              type="primary"
              @click="
                openDailyDetail(
                  row as HrmAttendanceStatisticsApi.MonthDailyOverview,
                  day.date,
                )
              "
            >
              <span class="flex w-full flex-col gap-0.5">
                <span
                  v-for="(item, index) in row.dailyClockMap[day.date]
                    .overviews || []"
                  :key="`${item.text || item.type}-${index}`"
                  class="grid min-h-5 w-full grid-cols-[32px_48px_1fr] items-center gap-x-1 leading-5"
                >
                  <template v-if="item.type">
                    <span class="text-muted-foreground">{{ item.type }}</span>
                    <span>{{ item.time }}</span>
                    <span :class="getHrmOverviewTextClass(item.status)">
                      {{ item.status }}
                    </span>
                  </template>
                  <span
                    v-else
                    class="col-span-3 text-center"
                    :class="getHrmOverviewTextClass(item.text)"
                  >
                    {{ item.text }}
                  </span>
                </span>
              </span>
            </ElButton>
            <span v-else class="text-muted-foreground">-</span>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </ElCard>
  </div>
</template>
