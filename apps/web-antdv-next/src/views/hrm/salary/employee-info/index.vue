<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';

import { Button, TabPane, Tabs } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getSalaryEmployeeInfoPage,
  getSalaryEmployeeInfoStatusCount,
} from '#/api/hrm/salary/employee-info';
import { HrmEmployeeStatusTab } from '#/views/hrm/utils/constants';

import {
  getSalaryEmployeeStatusTabItems,
  useGridColumns,
  useGridFormSchema,
} from './data';
import BatchForm from './modules/batch-form.vue';
import Form from './modules/form.vue';
import ImportForm from './modules/import-form.vue';

defineOptions({ name: 'HrmSalaryEmployeeInfo' });

const router = useRouter();

const activeStatus = ref(String(HrmEmployeeStatusTab.ACTIVE));
const statusCounts = ref<HrmSalaryEmployeeInfoApi.StatusCount[]>([]);
const checkedEmployeeIds = ref<number[]>([]);

const statusCategory = computed(() => Number(activeStatus.value));

const statusTabOptions = computed(() => {
  const countMap = Object.fromEntries(
    statusCounts.value.map((item) => [item.status, item.count]),
  );
  return getSalaryEmployeeStatusTabItems().map((item) => ({
    label: item.label,
    value: String(item.status),
    count: countMap[item.status] ?? 0,
  }));
});

const employeeInfoFormRef = ref<InstanceType<typeof Form>>();
const batchFormRef = ref<InstanceType<typeof BatchForm>>();
const importFormRef = ref<InstanceType<typeof ImportForm>>();

async function getStatusCounts() {
  const formValues = await gridApi.formApi.getValues();
  statusCounts.value = await getSalaryEmployeeInfoStatusCount({
    ...formValues,
    statusCategory: statusCategory.value,
  });
}

async function handleRefresh() {
  checkedEmployeeIds.value = [];
  await Promise.all([gridApi.query(), getStatusCounts()]);
}

function handleStatusTabChange(key: number | string) {
  activeStatus.value = String(key);
  handleRefresh();
}

function openDetail(employeeId?: number) {
  if (!employeeId) {
    return;
  }
  router.push({
    name: 'HrmSalaryEmployeeInfoDetail',
    params: { id: employeeId },
  });
}

function openSalaryForm(row: HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo) {
  employeeInfoFormRef.value?.open(row.employeeId);
}

function openBatchForm() {
  batchFormRef.value?.open([...checkedEmployeeIds.value]);
}

function openImportForm(type: 'change' | 'fix') {
  importFormRef.value?.open(type);
}

function handleRowCheckboxChange({
  records,
}: {
  records: HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo[];
}) {
  checkedEmployeeIds.value = records
    .map((item) => item.employeeId)
    .filter((employeeId): employeeId is number => employeeId !== undefined);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSalaryEmployeeInfoPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            statusCategory: statusCategory.value,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'employeeId',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
    checkboxConfig: {
      highlight: true,
    },
  } as VxeTableGridOptions<HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

onMounted(() => {
  getStatusCounts();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【薪资】计薪设置、薪资档案"
        url="https://doc.iocoder.cn/hrm/salary/config/"
      />
    </template>
    <Form ref="employeeInfoFormRef" @success="handleRefresh" />
    <BatchForm ref="batchFormRef" @success="handleRefresh" />
    <ImportForm ref="importFormRef" @success="handleRefresh" />

    <Grid table-title="薪资档案">
      <template #toolbar-actions>
        <Tabs
          :active-key="activeStatus"
          class="mb-0"
          type="card"
          @change="handleStatusTabChange"
        >
          <TabPane
            v-for="item in statusTabOptions"
            :key="item.value"
            :tab="`${item.label}（${item.count}）`"
          />
        </Tabs>
      </template>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '批量调薪',
              type: 'primary',
              icon: ACTION_ICON.EDIT,
              auth: ['hrm:salary:employee-info:update'],
              disabled: checkedEmployeeIds.length === 0,
              onClick: openBatchForm,
            },
            {
              label: '导入定薪',
              icon: ACTION_ICON.UPLOAD,
              auth: ['hrm:salary:employee-info:import'],
              onClick: () => openImportForm('fix'),
            },
            {
              label: '导入调薪',
              icon: ACTION_ICON.UPLOAD,
              auth: ['hrm:salary:employee-info:import'],
              onClick: () => openImportForm('change'),
            },
          ]"
        />
      </template>
      <template #employeeName="{ row }">
        <Button type="link" @click="openDetail(row.employeeId)">
          {{ row.employeeName || '-' }}
        </Button>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: row.id ? '调薪' : '定薪',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['hrm:salary:employee-info:update'],
              onClick: () => openSalaryForm(row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
