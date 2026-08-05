<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { computed, onMounted, ref } from 'vue';

import { confirm, useVbenForm } from '@vben/common-ui';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { Button, Card, Pagination, Table } from 'antdv-next';
import dayjs from 'dayjs';

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

const tableColumns = computed<TableColumnsType>(() => {
  const fixedColumns: TableColumnsType = [
    {
      dataIndex: 'employeeName',
      fixed: 'left',
      title: '员工',
      width: 120,
      ellipsis: true,
    },
    {
      dataIndex: 'jobNumber',
      fixed: 'left',
      title: '工号',
      width: 120,
      ellipsis: true,
    },
    {
      dataIndex: 'deptName',
      fixed: 'left',
      title: '部门',
      width: 140,
      ellipsis: true,
    },
    {
      dataIndex: 'postName',
      fixed: 'left',
      title: '岗位',
      width: 140,
      ellipsis: true,
    },
  ];
  const dayCols: TableColumnsType = dayColumns.value.map((day) => ({
    align: 'center',
    customHeaderCell: () => ({ class: 'whitespace-normal' }),
    dataIndex: day.date,
    key: day.date,
    minWidth: 168,
    title: `${day.day}\n${day.week}`,
  }));
  return [...fixedColumns, ...dayCols];
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

function handlePageChange(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  getList();
}

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <DailyDetail ref="dailyDetailRef" />

    <Card :bordered="false">
      <QueryForm />
      <div class="mt-2 flex flex-wrap gap-2">
        <Button type="primary" @click="handleQuery">搜索</Button>
        <Button @click="handleReset">重置</Button>
        <Button
          v-access:code="['hrm:attendance:clock:export']"
          :loading="exportLoading"
          @click="handleExport"
        >
          导出
        </Button>
      </div>
    </Card>

    <Card :bordered="false">
      <Table
        :columns="tableColumns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        :row-key="(row) => row.employeeId"
        :scroll="{ x: 'max-content' }"
        bordered
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template
            v-if="dayColumns.some((day) => day.date === column.dataIndex)"
          >
            <Button
              v-if="record.dailyClockMap?.[column.dataIndex as string]"
              block
              class="!h-auto min-h-[52px] !justify-start whitespace-normal !px-2 !py-1.5 text-left"
              type="link"
              @click="
                openDailyDetail(
                  record as HrmAttendanceStatisticsApi.MonthDailyOverview,
                  column.dataIndex as string,
                )
              "
            >
              <span class="flex w-full flex-col gap-0.5">
                <span
                  v-for="(item, index) in record.dailyClockMap[
                    column.dataIndex as string
                  ].overviews || []"
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
            </Button>
            <span v-else class="text-muted-foreground">-</span>
          </template>
        </template>
      </Table>

      <div class="mt-4 flex justify-end">
        <Pagination
          v-model:current="pageNo"
          v-model:page-size="pageSize"
          :show-size-changer="true"
          :total="total"
          show-quick-jumper
          @change="handlePageChange"
        />
      </div>
    </Card>
  </div>
</template>
