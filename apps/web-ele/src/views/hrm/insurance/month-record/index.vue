<script lang="ts" setup>
import type { HrmInsuranceMonthRecordApi } from '#/api/hrm/insurance/month-record';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import dayjs from 'dayjs';
import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { ACTION_ICON, TableAction } from '#/adapter/vxe-table';
import {
  createNextInsuranceMonthRecord,
  deleteInsuranceMonthRecord,
  getInsuranceMonthRecordList,
  getLastInsuranceMonthRecord,
} from '#/api/hrm/insurance/month-record';
import { HrmInsuranceMonthStatus } from '#/views/hrm/utils/constants';

import { useListColumns } from './data';
import FirstMonthForm from './modules/first-month-form.vue';

defineOptions({ name: 'HrmInsuranceMonthRecord' });

const router = useRouter();
const loading = ref(true);
const createLoading = ref(false);
const queryYear = ref<Date>(dayjs().toDate());
const list = ref<HrmInsuranceMonthRecordApi.InsuranceMonthRecord[]>([]);
const latestRecord = ref<HrmInsuranceMonthRecordApi.InsuranceMonthRecord>();
const columns = useListColumns();

const [FirstMonthModal, firstMonthModalApi] = useVbenModal({
  connectedComponent: FirstMonthForm,
  destroyOnClose: true,
});

async function getList(useLatestYear = false) {
  loading.value = true;
  try {
    latestRecord.value = await getLastInsuranceMonthRecord();
    if (useLatestYear && latestRecord.value?.year) {
      queryYear.value = dayjs(String(latestRecord.value.year), 'YYYY').toDate();
    }
    list.value = await getInsuranceMonthRecordList(
      dayjs(queryYear.value).year(),
    );
  } finally {
    loading.value = false;
  }
}

function openDetail(id?: number) {
  if (!id) {
    return;
  }
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

function handleCreateFirstSuccess(year: number) {
  queryYear.value = dayjs(String(year), 'YYYY').toDate();
  getList();
}

async function handleCreateNext() {
  try {
    await confirm({
      content: '新建次月社保后，本月数据将不可修改。请确认要新建次月社保吗？',
      title: '新建确认',
    });
    createLoading.value = true;
    const id = await createNextInsuranceMonthRecord();
    openDetail(id);
  } catch {
  } finally {
    createLoading.value = false;
  }
}

async function handleDelete(
  row: HrmInsuranceMonthRecordApi.InsuranceMonthRecord,
) {
  if (!row.id) {
    return;
  }
  try {
    await confirm({
      content: `确认删除“${row.title}”吗？`,
      icon: 'warning',
      title: '删除确认',
    });
    await deleteInsuranceMonthRecord(row.id);
    await getList();
  } catch {}
}

function isLatestEditableRecord(
  row: HrmInsuranceMonthRecordApi.InsuranceMonthRecord,
) {
  return (
    row.id === latestRecord.value?.id &&
    row.status === HrmInsuranceMonthStatus.UNARCHIVED
  );
}

onMounted(() => {
  getList(true);
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
    <ElCard>
      <div class="mb-4 flex items-center justify-between">
        <ElDatePicker
          v-model="queryYear"
          :clearable="false"
          class="!w-36"
          format="YYYY 年"
          type="year"
          @change="getList()"
        />
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
      </div>
      <ElTable
        v-loading="loading"
        :data="list"
        border
        row-key="id"
        size="small"
      >
        <ElTableColumn
          v-for="col in columns"
          :key="String(col.prop)"
          :align="col.align"
          :fixed="col.fixed"
          :formatter="col.formatter"
          :label="col.label"
          :min-width="col.minWidth"
          :prop="col.slot ? undefined : (col.prop as string)"
          :width="col.width"
        >
          <template v-if="col.slot === 'title'" #default="{ row }">
            <ElButton link type="primary" @click="openDetail(row.id)">
              {{ row.title }}
            </ElButton>
          </template>
          <template v-else-if="col.slot === 'action'" #default="{ row }">
            <TableAction
              :actions="[
                {
                  label: '删除',
                  type: 'danger',
                  link: true,
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
        </ElTableColumn>
      </ElTable>
    </ElCard>
    <FirstMonthModal @success="handleCreateFirstSuccess" />
  </Page>
</template>
