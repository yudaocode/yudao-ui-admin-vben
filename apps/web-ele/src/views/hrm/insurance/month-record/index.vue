<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmInsuranceMonthRecordApi } from '#/api/hrm/insurance/month-record';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createNextInsuranceMonthRecord,
  deleteInsuranceMonthRecord,
  getInsuranceMonthRecordList,
  getLastInsuranceMonthRecord,
} from '#/api/hrm/insurance/month-record';
import { HrmInsuranceMonthStatus } from '#/views/hrm/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import FirstMonthForm from './modules/first-month-form.vue';

defineOptions({ name: 'HrmInsuranceMonthRecord' });

const router = useRouter();
const createLoading = ref(false);
const latestRecord = ref<HrmInsuranceMonthRecordApi.InsuranceMonthRecord>();

const [FirstMonthModal, firstMonthModalApi] = useVbenModal({
  connectedComponent: FirstMonthForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: false },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async (_params, formValues) =>
          getInsuranceMonthRecordList(Number(formValues.year)),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<HrmInsuranceMonthRecordApi.InsuranceMonthRecord>,
});

async function loadLatestRecord() {
  latestRecord.value = await getLastInsuranceMonthRecord();
}

function openDetail(id?: number) {
  if (!id) return;
  router.push({
    name: 'HrmInsuranceMonthRecordDetail',
    params: { id },
  });
}

function handleCreate() {
  if (!latestRecord.value) {
    firstMonthModalApi.open();
    return;
  }
  handleCreateNext();
}

async function handleCreateFirstSuccess(year: number) {
  await gridApi.formApi.setFieldValue('year', String(year));
  await loadLatestRecord();
  await gridApi.query();
}

async function handleCreateNext() {
  try {
    await confirm({
      content: '新建次月社保后，本月数据将不可修改。请确认要新建次月社保吗？',
      title: '新建确认',
    });
  } catch {
    return;
  }
  createLoading.value = true;
  try {
    openDetail(await createNextInsuranceMonthRecord());
  } finally {
    createLoading.value = false;
  }
}

async function handleDelete(
  row: HrmInsuranceMonthRecordApi.InsuranceMonthRecord,
) {
  if (!row.id) return;
  await deleteInsuranceMonthRecord(row.id);
  await loadLatestRecord();
  await gridApi.query();
}

function isLatestEditableRecord(
  row: HrmInsuranceMonthRecordApi.InsuranceMonthRecord,
) {
  return (
    row.id === latestRecord.value?.id &&
    row.status === HrmInsuranceMonthStatus.UNARCHIVED
  );
}

onMounted(async () => {
  await loadLatestRecord();
  if (latestRecord.value?.year) {
    await gridApi.formApi.setFieldValue(
      'year',
      String(latestRecord.value.year),
    );
  }
  await gridApi.query();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【社保】社保管理"
        url="https://doc.iocoder.cn/hrm/insurance/"
      />
    </template>
    <Grid table-title="社保表列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: latestRecord ? '新建次月社保表' : '新建首月社保表',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:insurance:month-record:create'],
              loading: createLoading,
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #title="{ row }">
        <a @click="openDetail(row.id)">{{ row.title }}</a>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '删除',
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:insurance:month-record:delete'],
              ifShow: isLatestEditableRecord(row),
              popConfirm: {
                title: `确认删除“${row.title}”吗？`,
                confirm: () => handleDelete(row),
              },
            },
          ]"
        />
      </template>
    </Grid>
    <FirstMonthModal @success="handleCreateFirstSuccess" />
  </Page>
</template>
