<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaAttendanceApi } from '#/api/oa/attendance';

import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAttendanceMonthReport } from '#/api/oa/attendance';

import { useMonthGridColumns, useMonthGridFormSchema } from '../data';

defineOptions({ name: 'OaAttendanceMonthReport' });

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useMonthGridFormSchema(),
  },
  gridOptions: {
    columns: useMonthGridColumns(),
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params, formValues) => {
          // 转换月份为后端需要的年份和月份
          const monthDate = dayjs(formValues.month);
          const list = await getAttendanceMonthReport({
            year: monthDate.year(),
            month: monthDate.month() + 1,
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
  } as VxeTableGridOptions<OaAttendanceApi.AttendanceMonthReport>,
});
</script>

<template>
  <Grid />
</template>
