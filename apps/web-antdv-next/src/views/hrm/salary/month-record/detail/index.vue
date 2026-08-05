<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, Card, message, Spin } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getSalaryMonthOptionSummary,
  getSalaryMonthRecord,
} from '#/api/hrm/salary/month-record';
import { getSalaryMonthEmployeeRecordPage } from '#/api/hrm/salary/month-record/employee';
import { HrmSalaryMonthStatus } from '#/views/hrm/utils/constants';

import {
  buildDetailGridColumns,
  buildFooterMethod,
  useSearchFormSchema,
} from './data';
import RecordDetailsInfo from './modules/record-details-info.vue';

defineOptions({ name: 'HrmSalaryHistoryDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const recordId = Number(route.params.id);
const recordLoading = ref(true);
const record = ref<HrmSalaryMonthRecordApi.SalaryMonthRecord>({});
const summaryList = ref<HrmSalaryOptionApi.OptionValue[]>([]);

const summaryMap = computed<Record<number, number>>(() =>
  Object.fromEntries(
    summaryList.value
      .filter((option) => option.code !== undefined)
      .map((option) => [option.code, Number(option.value || 0)]),
  ),
);

function close() {
  tabs.closeCurrentTab();
  router.push({ name: 'HrmSalaryHistory' });
}

async function getRecord() {
  recordLoading.value = true;
  try {
    const data = await getSalaryMonthRecord(recordId);
    if (!data || data.status !== HrmSalaryMonthStatus.HISTORY) {
      message.warning('历史工资表不存在');
      close();
      return;
    }
    record.value = data;
    gridApi.setGridOptions({
      columns: buildDetailGridColumns(data.optionHeaders),
      footerMethod: buildFooterMethod(summaryMap.value),
    });
  } finally {
    recordLoading.value = false;
  }
}

async function getSummary(formValues?: Record<string, unknown>) {
  if (!record.value.id) {
    summaryList.value = [];
    return;
  }
  const values = formValues || (await gridApi.formApi.getValues()) || {};
  summaryList.value = await getSalaryMonthOptionSummary({
    deptId: values.deptId,
    employeeName: values.employeeName,
    jobNumber: values.jobNumber,
    monthRecordId: record.value.id,
  });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSearchFormSchema(),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: buildDetailGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (!record.value.id) {
            return { list: [], total: 0 };
          }
          await getSummary(formValues);
          return await getSalaryMonthEmployeeRecordPage({
            deptId: formValues.deptId,
            employeeName: formValues.employeeName,
            jobNumber: formValues.jobNumber,
            monthRecordId: record.value.id,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          });
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
      columns: buildDetailGridColumns(optionHeaders),
      footerMethod: buildFooterMethod(summaryMap.value),
    });
  },
);

async function init() {
  if (!Number.isSafeInteger(recordId) || recordId <= 0) {
    message.warning('参数错误，历史工资表不能为空！');
    close();
    return;
  }
  await getRecord();
  if (record.value.id) {
    await gridApi.query();
  }
}

onMounted(init);
</script>

<template>
  <Page auto-content-height content-class="flex flex-col overflow-hidden">
    <Card class="mb-4 shrink-0">
      <div class="flex items-center gap-3">
        <Button @click="close">返回</Button>
        <span class="text-lg font-semibold">
          {{ record.title || '历史工资表详情' }}
        </span>
      </div>
    </Card>

    <div class="mb-4 shrink-0">
      <Spin :spinning="recordLoading">
        <RecordDetailsInfo :record="record" />
      </Spin>
    </div>

    <Grid v-if="record.id" class="min-h-0 flex-1" table-title="员工工资明细" />
  </Page>
</template>
