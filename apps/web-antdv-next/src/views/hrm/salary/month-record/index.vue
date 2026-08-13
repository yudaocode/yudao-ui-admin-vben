<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { confirm, DocAlert, Page } from '@vben/common-ui';

import { Alert, Button, Card, Empty, Spin, TabPane, Tabs } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createNextSalaryMonthRecord,
  deleteSalaryMonthRecord,
  getLastSalaryMonthRecord,
  getSalaryMonthOptionSummary,
  getSalaryMonthRecord,
} from '#/api/hrm/salary/month-record';
import {
  getSalaryMonthEmployeeChangeCount,
  getSalaryMonthEmployeeRecordPage,
} from '#/api/hrm/salary/month-record/employee';
import {
  HrmSalaryEmployeeChangeType,
  HrmSalaryMonthStatus,
} from '#/views/hrm/utils/constants';
import { formatHrmDateRange } from '#/views/hrm/utils/format';

import SlipSendForm from '../slip/send-record/modules/slip-send-form.vue';
import PayrollReadinessAlert from './components/payroll-readiness-alert.vue';
import {
  buildFooterMethod,
  buildGridColumns,
  useSearchFormSchema,
} from './data';
import BatchEmployeeRecordForm from './modules/batch-employee-record-form.vue';
import ComputeForm from './modules/compute-form.vue';

defineOptions({ name: 'HrmSalaryMonthRecord' });

const employeeChangeTabs = [
  { label: '计薪人数', type: HrmSalaryEmployeeChangeType.ALL },
  { label: '新入职', type: HrmSalaryEmployeeChangeType.ENTRY },
  { label: '离职', type: HrmSalaryEmployeeChangeType.LEAVE },
  { label: '转正', type: HrmSalaryEmployeeChangeType.REGULAR },
  { label: '调岗', type: HrmSalaryEmployeeChangeType.TRANSFER },
];

const pageLoading = ref(false);
const createLoading = ref(false);
const record = ref<HrmSalaryMonthRecordApi.SalaryMonthRecord>({});
const employeeChangeCount = ref<Record<number, number>>({});
const summaryList = ref<HrmSalaryOptionApi.OptionValue[]>([]);
const employeeChangeType = ref<number>(HrmSalaryEmployeeChangeType.ALL);
const readinessAlertRef = ref<InstanceType<typeof PayrollReadinessAlert>>();
const batchFormRef = ref<InstanceType<typeof BatchEmployeeRecordForm>>();
const computeFormRef = ref<InstanceType<typeof ComputeForm>>();
const slipSendFormRef = ref<InstanceType<typeof SlipSendForm>>();

const isArchived = computed(
  () => record.value.status === HrmSalaryMonthStatus.HISTORY,
);
const isComputed = computed(
  () => record.value.status === HrmSalaryMonthStatus.COMPUTED,
);
const isWritable = computed(() => !isArchived.value);
const summaryMap = computed<Record<number, number>>(() =>
  Object.fromEntries(
    summaryList.value
      .filter((option) => option.code !== undefined)
      .map((option) => [option.code, Number(option.value || 0)]),
  ),
);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSearchFormSchema(),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: buildGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (!record.value.id) {
            return { list: [], total: 0 };
          }
          const [pageResult] = await Promise.all([
            getSalaryMonthEmployeeRecordPage({
              deptId: formValues.deptId,
              employeeChangeType: employeeChangeType.value,
              employeeName: formValues.employeeName,
              jobNumber: formValues.jobNumber,
              monthRecordId: record.value.id,
              pageNo: page.currentPage,
              pageSize: page.pageSize,
            }),
            getEmployeeChangeCount(formValues),
            getSummary(formValues),
          ]);
          return pageResult;
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    showFooter: true,
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord>,
});

watch(summaryMap, () => {
  gridApi.setGridOptions({
    footerMethod: buildFooterMethod(summaryMap.value),
  });
});

watch(
  () => record.value.optionHeaders,
  (optionHeaders) => {
    gridApi.setGridOptions({
      columns: buildGridColumns(optionHeaders),
      footerMethod: buildFooterMethod(summaryMap.value),
    });
  },
);

async function getRecord() {
  if (!record.value.id) {
    return;
  }
  record.value = await getSalaryMonthRecord(record.value.id);
  gridApi.setGridOptions({
    columns: buildGridColumns(record.value.optionHeaders),
  });
}

async function getEmployeeChangeCount(formValues?: Record<string, unknown>) {
  if (!record.value.id) {
    employeeChangeCount.value = {};
    return;
  }
  const values = formValues || (await gridApi.formApi.getValues()) || {};
  // 不传 employeeChangeType，保证各 Tab 数量基于同一筛选集合统计
  const raw = await getSalaryMonthEmployeeChangeCount({
    deptId: typeof values.deptId === 'number' ? values.deptId : undefined,
    employeeName:
      typeof values.employeeName === 'string' ? values.employeeName : undefined,
    jobNumber:
      typeof values.jobNumber === 'string' ? values.jobNumber : undefined,
    monthRecordId: record.value.id,
  });
  employeeChangeCount.value = Object.fromEntries(
    Object.entries(raw || {}).map(([key, value]) => [
      Number(key),
      Number(value),
    ]),
  );
}

async function getSummary(formValues?: Record<string, unknown>) {
  if (!record.value.id) {
    summaryList.value = [];
    return;
  }
  const values = formValues || (await gridApi.formApi.getValues()) || {};
  summaryList.value = await getSalaryMonthOptionSummary({
    deptId: values.deptId,
    employeeChangeType: employeeChangeType.value,
    employeeName: values.employeeName,
    jobNumber: values.jobNumber,
    monthRecordId: record.value.id,
  });
}

async function getReadiness() {
  await nextTick();
  await readinessAlertRef.value?.refresh();
}

async function refreshData() {
  await Promise.all([
    getRecord(),
    gridApi.query(),
    getEmployeeChangeCount(),
    getSummary(),
    getReadiness(),
  ]);
}

async function handleTabChange(type: number | string) {
  employeeChangeType.value = Number(type);
  await gridApi.query();
}

async function handleCreate() {
  createLoading.value = true;
  try {
    await createNextSalaryMonthRecord();
    await init();
  } finally {
    createLoading.value = false;
  }
}

async function handleCreateNext() {
  try {
    await confirm({
      content:
        '新建下月工资表后，当前工资表将归入历史工资且不可修改。请确认要新建下月工资表吗？',
      title: '新建确认',
    });
    await createNextSalaryMonthRecord();
    await init();
  } catch {}
}

async function handleDelete() {
  if (!record.value.id) {
    return;
  }
  try {
    await confirm({
      content:
        '删除当前工资表后，上月工资表将恢复为当前工资表且支持修改。请确认要删除当前工资表吗？',
      title: '删除确认',
    });
    await deleteSalaryMonthRecord(record.value.id);
    await init();
  } catch {}
}

async function openBatchEdit() {
  const formValues = await gridApi.formApi.getValues();
  batchFormRef.value?.open(record.value, {
    deptId: formValues.deptId,
    employeeChangeType: employeeChangeType.value,
    employeeName: formValues.employeeName,
    jobNumber: formValues.jobNumber,
  });
}

function openSlipSendForm() {
  if (record.value.id) {
    slipSendFormRef.value?.open(record.value.id);
  }
}

async function init() {
  pageLoading.value = true;
  try {
    record.value = (await getLastSalaryMonthRecord()) || {};
    employeeChangeType.value = HrmSalaryEmployeeChangeType.ALL;
    if (!record.value.id) {
      employeeChangeCount.value = {};
      summaryList.value = [];
      return;
    }
    gridApi.setGridOptions({
      columns: buildGridColumns(record.value.optionHeaders),
      footerMethod: buildFooterMethod(summaryMap.value),
    });
    await Promise.all([
      gridApi.query(),
      getEmployeeChangeCount(),
      getSummary(),
      getReadiness(),
    ]);
  } finally {
    pageLoading.value = false;
  }
}

onMounted(() => {
  init();
});
</script>

<template>
  <Page auto-content-height content-class="flex flex-col overflow-hidden">
    <template #doc>
      <DocAlert
        title="【薪资】月度工资、工资条"
        url="https://doc.iocoder.cn/hrm/salary/payroll/"
      />
    </template>
    <div class="shrink-0">
      <Spin :spinning="pageLoading">
        <Card v-if="record.id" class="mb-4">
          <div class="flex items-center">
            <span class="text-lg font-bold">月度工资表</span>
            <span class="ml-2 text-sm text-muted-foreground">
              （计薪周期：{{
                formatHrmDateRange(record.startTime, record.endTime)
              }}）
            </span>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <TableAction
              :actions="[
                {
                  label: '在线编辑',
                  type: 'primary',
                  icon: ACTION_ICON.EDIT,
                  auth: ['hrm:salary:month-record:update'],
                  ifShow: isWritable,
                  onClick: openBatchEdit,
                },
                {
                  label: '核算工资',
                  type: 'primary',
                  icon: 'lucide:cpu',
                  auth: ['hrm:salary:month-record:compute'],
                  ifShow: isWritable,
                  onClick: () => computeFormRef?.open(record),
                },
                {
                  label: '发送工资条',
                  type: 'primary',
                  icon: 'lucide:send',
                  auth: ['hrm:salary:slip:create'],
                  ifShow: isComputed,
                  onClick: openSlipSendForm,
                },
                {
                  label: '创建下月工资表',
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['hrm:salary:month-record:create'],
                  onClick: handleCreateNext,
                },
                {
                  label: '删除工资表',
                  type: 'primary',
                  danger: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['hrm:salary:month-record:delete'],
                  ifShow: isWritable,
                  onClick: handleDelete,
                },
              ]"
            />
          </div>

          <Alert
            v-if="isArchived"
            message="当前工资表已归档，仅可查询。"
            show-icon
            type="info"
            :style="{ marginTop: '16px' }"
          />
          <PayrollReadinessAlert
            ref="readinessAlertRef"
            :month-record-id="record.id"
          />
        </Card>

        <Card v-else>
          <Empty description="暂无月度工资表">
            <Button
              v-access:code="['hrm:salary:month-record:create']"
              :loading="createLoading"
              type="primary"
              @click="handleCreate"
            >
              初始化月度工资表
            </Button>
          </Empty>
        </Card>
      </Spin>
    </div>

    <template v-if="record.id">
      <Tabs
        class="mt-4 shrink-0"
        :active-key="String(employeeChangeType)"
        :style="{ marginBottom: '8px' }"
        @change="handleTabChange"
      >
        <TabPane
          v-for="tab in employeeChangeTabs"
          :key="String(tab.type)"
          :tab="`${tab.label}（${employeeChangeCount[tab.type] || 0}）`"
        />
      </Tabs>
      <Grid class="min-h-0 flex-1" />
    </template>

    <BatchEmployeeRecordForm ref="batchFormRef" @success="refreshData" />
    <ComputeForm ref="computeFormRef" @success="refreshData" />
    <SlipSendForm ref="slipSendFormRef" @success="refreshData" />
  </Page>
</template>
