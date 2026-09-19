<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaAttendanceApi } from '#/api/oa/attendance';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { Button } from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAttendanceWeekReport } from '#/api/oa/attendance';
import { OA_ATTENDANCE_TYPE } from '#/views/oa/utils/constants';

import Form from '../../list/modules/form.vue';
import {
  getClockText,
  getWeekDayIndex,
  getWeekStartDate,
  useWeekGridColumns,
  useWeekGridFormSchema,
} from '../data';

defineOptions({ name: 'OaAttendanceWeekReport' });

const { hasAccessByCodes } = useAccess();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 修改考勤记录 */
function handleEdit(id: number) {
  formModalApi.setData({ id }).open();
}

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 切换到上一周或下一周 */
async function handleWeekChange(days: number) {
  const { startDate } = await gridApi.formApi.getValues();
  await gridApi.formApi.setFieldValue(
    'startDate',
    dayjs(startDate).add(days, 'day').format('YYYY-MM-DD'),
  );
  // 提交表单同步最新查询值并重载（query 取的是上次提交值，直接 query 会沿用旧周）
  await gridApi.formApi.submit();
}

/** 切换到本周 */
async function handleCurrentWeek() {
  await gridApi.formApi.setFieldValue('startDate', getWeekStartDate(dayjs()));
  await gridApi.formApi.submit();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useWeekGridFormSchema(),
  },
  gridOptions: {
    border: true,
    columns: useWeekGridColumns(getWeekStartDate(dayjs())),
    keepSource: true,
    // 每天展示上下班两行，关闭单行截断，让行高随内容撑开
    showOverflow: false,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params, formValues) => {
          const startDate = getWeekStartDate(dayjs(formValues.startDate));
          // 日期列标题跟随所在周变化
          gridApi.setState({
            gridOptions: { columns: useWeekGridColumns(startDate) || [] },
          });
          const list = await getAttendanceWeekReport({
            startDate,
            userId: formValues.userId,
          });
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      keyField: 'userId',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaAttendanceApi.AttendanceWeekReport>,
});
</script>

<template>
  <FormModal @success="handleRefresh" />

  <Grid>
    <template #toolbar-tools>
      <Button class="mr-2" @click="handleWeekChange(-7)">上一周</Button>
      <Button class="mr-2" @click="handleCurrentWeek">本周</Button>
      <Button @click="handleWeekChange(7)">下一周</Button>
    </template>
    <template #dayCell="{ row, column }">
      <div class="leading-6">
        <div>
          上班：
          <Button
            v-if="
              row.dailyAttendances[getWeekDayIndex(column.field)]?.clockInId &&
              hasAccessByCodes(['oa:attendance:update'])
            "
            type="link"
            class="!h-auto !p-0"
            @click="
              handleEdit(
                row.dailyAttendances[getWeekDayIndex(column.field)]!.clockInId!,
              )
            "
          >
            {{
              getClockText(
                row.dailyAttendances[getWeekDayIndex(column.field)],
                OA_ATTENDANCE_TYPE.CLOCK_IN,
              )
            }}
          </Button>
          <span v-else>
            {{
              getClockText(
                row.dailyAttendances[getWeekDayIndex(column.field)],
                OA_ATTENDANCE_TYPE.CLOCK_IN,
              )
            }}
          </span>
        </div>
        <div>
          下班：
          <Button
            v-if="
              row.dailyAttendances[getWeekDayIndex(column.field)]
                ?.clockOutId && hasAccessByCodes(['oa:attendance:update'])
            "
            type="link"
            class="!h-auto !p-0"
            @click="
              handleEdit(
                row.dailyAttendances[getWeekDayIndex(column.field)]!
                  .clockOutId!,
              )
            "
          >
            {{
              getClockText(
                row.dailyAttendances[getWeekDayIndex(column.field)],
                OA_ATTENDANCE_TYPE.CLOCK_OUT,
              )
            }}
          </Button>
          <span v-else>
            {{
              getClockText(
                row.dailyAttendances[getWeekDayIndex(column.field)],
                OA_ATTENDANCE_TYPE.CLOCK_OUT,
              )
            }}
          </span>
        </div>
      </div>
    </template>
  </Grid>
</template>
