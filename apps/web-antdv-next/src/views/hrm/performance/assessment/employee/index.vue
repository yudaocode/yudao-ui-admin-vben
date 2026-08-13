<script lang="ts" setup>
import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, DocAlert, Page } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { Avatar, Button, Card, message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePerformanceArchiveRecords,
  getPerformanceArchivePlanSimpleList,
  getPerformanceAssessmentArchivePage,
} from '#/api/hrm/performance/assessment';
import { $t } from '#/locales';

import {
  useEmployeeArchiveFormSchema,
  useEmployeeArchiveGridColumns,
} from '../data';

defineOptions({ name: 'HrmPerformanceAssessmentEmployee' });

const route = useRoute();
const router = useRouter();
const employeeId = computed(() => Number(route.params.employeeId));

const employeeInfo = ref<
  Partial<HrmPerformanceAssessmentApi.PerformanceAssessment>
>({});
const planOptions = ref<{ label: string; value: number }[]>([]);
const checkedIds = ref<number[]>([]);

async function loadPlanOptions() {
  const list = await getPerformanceArchivePlanSimpleList();
  planOptions.value = list.map((item) => ({
    label: item.name,
    value: item.id,
  }));
  gridApi.formApi.updateSchema(useEmployeeArchiveFormSchema(planOptions.value));
}

function openDetail(id: number) {
  router.push({
    name: 'HrmPerformanceAssessmentDetail',
    params: { id },
    query: { employeeId: String(employeeId.value), archived: 'true' },
  });
}

function handleBack() {
  router.push({ name: 'HrmPerformanceAssessment' });
}

async function handleDelete(ids: number[]) {
  if (ids.length === 0) return;
  await confirm($t('ui.actionMessage.deleteConfirm'));
  await deletePerformanceArchiveRecords(ids);
  message.success($t('ui.actionMessage.deleteSuccess'));
  const page = await getPerformanceAssessmentArchivePage({
    pageNo: 1,
    pageSize: 1,
    employeeId: employeeId.value,
  });
  if (!page.total) {
    handleBack();
    return;
  }
  await gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useEmployeeArchiveFormSchema([]),
  },
  gridOptions: {
    columns: useEmployeeArchiveGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          const data = await getPerformanceAssessmentArchivePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            employeeId: employeeId.value,
            ...formValues,
          });
          if (data.list?.length) {
            employeeInfo.value = data.list[0]!;
          }
          return data;
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    checkboxConfig: { highlight: true },
  },
  gridEvents: {
    checkboxAll: ({
      records,
    }: {
      records: HrmPerformanceAssessmentApi.PerformanceAssessment[];
    }) => {
      checkedIds.value = records.map((r) => r.id!).filter(Boolean);
    },
    checkboxChange: ({
      records,
    }: {
      records: HrmPerformanceAssessmentApi.PerformanceAssessment[];
    }) => {
      checkedIds.value = records.map((r) => r.id!).filter(Boolean);
    },
  },
});

onMounted(loadPlanOptions);
</script>

<template>
  <Page auto-content-height content-class="flex flex-col overflow-hidden">
    <template #doc>
      <DocAlert
        title="【绩效】绩效考核、绩效档案"
        url="https://doc.iocoder.cn/hrm/performance/assessment/"
      />
    </template>
    <Card class="mb-4 shrink-0">
      <div class="flex items-center gap-4">
        <Button @click="handleBack">返回</Button>
        <Avatar :size="48">{{ employeeInfo.employeeName?.slice(0, 1) }}</Avatar>
        <div>
          <div class="text-lg font-semibold">
            {{ employeeInfo.employeeName }}
          </div>
          <div class="text-sm text-gray-500">
            {{ employeeInfo.deptName }} / {{ employeeInfo.postName }} /
            {{ employeeInfo.jobNumber }} /
            {{
              getDictLabel(
                DICT_TYPE.HRM_EMPLOYEE_TYPE,
                employeeInfo.employeeType,
              )
            }}
          </div>
        </div>
      </div>
    </Card>
    <Grid class="min-h-0 flex-1" table-title="绩效档案记录">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '批量删除',
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:performance:archive:delete'],
              disabled: !checkedIds.length,
              onClick: () => handleDelete(checkedIds),
            },
          ]"
        />
      </template>
      <template #planName="{ row }">
        <a class="text-primary cursor-pointer" @click="openDetail(row.id!)">
          {{ row.name }}
        </a>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              auth: ['hrm:performance:archive:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm'),
                confirm: () => handleDelete([row.id!]),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
