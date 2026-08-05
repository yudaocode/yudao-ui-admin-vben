<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmInsuranceMonthRecordApi } from '#/api/hrm/insurance/month-record';
import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  message,
  Spin,
} from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getInsuranceMonthRecord } from '#/api/hrm/insurance/month-record';
import {
  getInsuranceMonthEmployeeRecordPage,
  stopInsuranceMonthEmployeeRecordList,
} from '#/api/hrm/insurance/month-record/employee';
import {
  HrmInsuranceEmployeeStatus,
  HrmInsuranceMonthStatus,
} from '#/views/hrm/utils/constants';
import { formatHrmMoney } from '#/views/hrm/utils/format';

import { useGridColumns, useGridFormSchema } from './data';
import AddEmployeeForm from './modules/add-employee-form.vue';
import BatchEmployeeRecordForm from './modules/batch-employee-record-form.vue';
import EmployeeDetailDrawer from './modules/employee-detail-drawer.vue';
import EmployeeRecordForm from './modules/employee-record-form.vue';

defineOptions({ name: 'HrmInsuranceMonthRecordDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const monthRecordId = Number(route.params.id);
const recordLoading = ref(true);
const monthRecord = ref<HrmInsuranceMonthRecordApi.InsuranceMonthRecord>({});
const checkedIds = ref<number[]>([]);
const activeStatus = ref<number>(HrmInsuranceEmployeeStatus.NORMAL);

const editable = computed(
  () => monthRecord.value.status === HrmInsuranceMonthStatus.UNARCHIVED,
);

const stoppableSelectedIds = computed(() =>
  (gridApi.grid?.getCheckboxRecords() || [])
    .filter(
      (row: HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord) =>
        row.status === HrmInsuranceEmployeeStatus.NORMAL,
    )
    .map(
      (row: HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord) =>
        row.id!,
    )
    .filter(Boolean),
);

const employeeDetailRef = ref<InstanceType<typeof EmployeeDetailDrawer>>();

const [AddEmployeeModal, addEmployeeModalApi] = useVbenModal({
  connectedComponent: AddEmployeeForm,
  destroyOnClose: true,
});

const [EmployeeRecordModal, employeeRecordModalApi] = useVbenModal({
  connectedComponent: EmployeeRecordForm,
  destroyOnClose: true,
});

const [BatchEmployeeRecordModal, batchEmployeeRecordModalApi] = useVbenModal({
  connectedComponent: BatchEmployeeRecordForm,
  destroyOnClose: true,
});

function close() {
  tabs.closeCurrentTab();
  router.push({ name: 'HrmInsuranceMonthRecord' });
}

async function getMonthRecord() {
  recordLoading.value = true;
  try {
    const data = await getInsuranceMonthRecord(monthRecordId);
    if (!data) {
      message.warning('月度社保表不存在');
      close();
      return;
    }
    monthRecord.value = data;
  } finally {
    recordLoading.value = false;
  }
}

function handleRefresh() {
  gridApi.query();
}

async function refreshData() {
  await Promise.all([getMonthRecord(), gridApi.query()]);
}

function handleStatusChange(status: number) {
  activeStatus.value = status;
  gridApi.formApi.setValues({ status });
  handleRefresh();
}

function handleRowCheckboxChange({
  records,
}: {
  records: HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord[];
}) {
  checkedIds.value = records.map((row) => row.id!).filter(Boolean);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(editable.value),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getInsuranceMonthEmployeeRecordPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            monthRecordId,
            status: activeStatus.value,
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
  } as VxeTableGridOptions<HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

async function handleStop(ids: number[]) {
  if (!editable.value || ids.length === 0) {
    return;
  }
  try {
    await confirm({
      content: `确认停止选中的 ${ids.length} 名员工参保吗？`,
      title: '停止参保确认',
    });
    await stopInsuranceMonthEmployeeRecordList({ ids });
    message.success('停止参保成功');
    await refreshData();
  } catch {}
}

async function init() {
  if (!Number.isSafeInteger(monthRecordId) || monthRecordId <= 0) {
    message.warning('参数错误，月度社保表不能为空！');
    close();
    return;
  }
  await Promise.all([getMonthRecord(), gridApi.query()]);
}

onMounted(init);

watch(editable, (value) => {
  gridApi.setGridOptions({ columns: useGridColumns(value) });
});
</script>

<template>
  <Page auto-content-height content-class="flex flex-col overflow-hidden">
    <Card class="mb-4 shrink-0">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <Button @click="close">返回</Button>
          <span class="text-lg font-semibold">
            {{ monthRecord.title || '月度社保详情' }}
          </span>
        </div>
        <TableAction
          v-if="editable"
          :actions="[
            {
              label: '添加参保人员',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:insurance:month-record:update'],
              onClick: () =>
                addEmployeeModalApi.setData({ recordId: monthRecordId }).open(),
            },
          ]"
        />
      </div>
    </Card>

    <div class="mb-4 shrink-0">
      <Spin :spinning="recordLoading">
        <Card>
          <Descriptions :column="3" bordered size="small">
            <DescriptionsItem label="参保人数">
              <Button
                type="link"
                @click="handleStatusChange(HrmInsuranceEmployeeStatus.NORMAL)"
              >
                {{ monthRecord.insuredEmployeeCount ?? 0 }}
              </Button>
            </DescriptionsItem>
            <DescriptionsItem label="停保人数">
              <Button
                type="link"
                @click="handleStatusChange(HrmInsuranceEmployeeStatus.STOPPED)"
              >
                {{ monthRecord.stoppedEmployeeCount ?? 0 }}
              </Button>
            </DescriptionsItem>
            <DescriptionsItem label="个人社保">
              {{ formatHrmMoney(monthRecord.personalInsuranceAmount) }}
            </DescriptionsItem>
            <DescriptionsItem label="公司社保">
              {{ formatHrmMoney(monthRecord.corporateInsuranceAmount) }}
            </DescriptionsItem>
            <DescriptionsItem label="个人公积金">
              {{ formatHrmMoney(monthRecord.personalProvidentFundAmount) }}
            </DescriptionsItem>
            <DescriptionsItem label="公司公积金">
              {{ formatHrmMoney(monthRecord.corporateProvidentFundAmount) }}
            </DescriptionsItem>
          </Descriptions>
          <Alert
            v-if="monthRecord.id && !editable"
            class="mt-4"
            message="当前社保表已归档，仅可查询。"
            show-icon
            type="info"
          />
        </Card>
      </Spin>
    </div>

    <Grid class="min-h-0 flex-1" table-title="参保人员">
      <template #toolbar-tools>
        <TableAction
          v-if="editable"
          :actions="[
            {
              label: '调整参保方案',
              type: 'primary',
              auth: ['hrm:insurance:month-record:update'],
              disabled: checkedIds.length === 0,
              onClick: () =>
                batchEmployeeRecordModalApi.setData(checkedIds).open(),
            },
            {
              label: '停止参保',
              type: 'primary',
              danger: true,
              auth: ['hrm:insurance:month-record:update'],
              disabled: stoppableSelectedIds.length === 0,
              onClick: () => handleStop(stoppableSelectedIds),
            },
          ]"
        />
      </template>
      <template #employeeName="{ row }">
        <Button type="link" @click="employeeDetailRef?.open(row.id)">
          {{ row.employeeName || '-' }}
        </Button>
      </template>
    </Grid>

    <AddEmployeeModal @success="refreshData" />
    <EmployeeRecordModal @success="refreshData" />
    <BatchEmployeeRecordModal @success="refreshData" />
    <EmployeeDetailDrawer
      ref="employeeDetailRef"
      :editable="editable"
      @edit="(row) => employeeRecordModalApi.setData(row).open()"
    />
  </Page>
</template>
