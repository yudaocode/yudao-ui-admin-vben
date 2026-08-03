<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { useRouter } from 'vue-router';

import { Button } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getEmployeePage } from '#/api/hrm/employee';
import { HrmEmployeeStatusTab } from '#/views/hrm/utils/constants';

import { useEmployeeGridColumns, useEmployeeGridFormSchema } from '../data';

const props = defineProps<{
  deptId: number;
}>();

const router = useRouter();

/** 打开员工档案详情 */
function openEmployeeDetail(id?: number) {
  if (id === undefined) {
    return;
  }
  router.push({ name: 'HrmEmployeeDetail', params: { id } });
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useEmployeeGridFormSchema(),
  },
  gridOptions: {
    columns: useEmployeeGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getEmployeePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            deptId: props.deptId,
            statusCategory: HrmEmployeeStatusTab.ACTIVE,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<HrmEmployeeApi.Employee>,
});
</script>

<template>
  <Grid>
    <template #name="{ row }">
      <Button type="link" @click="openEmployeeDetail(row.id)">
        {{ row.name }}
      </Button>
    </template>
  </Grid>
</template>
