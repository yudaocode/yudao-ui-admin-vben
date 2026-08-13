<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { HrmInsuranceMonthRecordApi } from '#/api/hrm/insurance/month-record';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { Button, Card, DatePicker, Spin, Table } from 'antdv-next';
import dayjs from 'dayjs';

import { ACTION_ICON, TableAction } from '#/adapter/vxe-table';
import {
  createNextInsuranceMonthRecord,
  deleteInsuranceMonthRecord,
  getInsuranceMonthRecordList,
  getLastInsuranceMonthRecord,
} from '#/api/hrm/insurance/month-record';
import { HrmInsuranceMonthStatus } from '#/views/hrm/utils/constants';
import { formatHrmMoney } from '#/views/hrm/utils/format';

import { useListColumns } from './data';
import FirstMonthForm from './modules/first-month-form.vue';

defineOptions({ name: 'HrmInsuranceMonthRecord' });

const router = useRouter();
const loading = ref(true);
const createLoading = ref(false);
const queryYear = ref<Dayjs>(dayjs());
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
      queryYear.value = dayjs(String(latestRecord.value.year), 'YYYY');
    }
    list.value = await getInsuranceMonthRecordList(queryYear.value.year());
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
  queryYear.value = dayjs(String(year), 'YYYY');
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
    <Card>
      <div class="mb-4 flex items-center justify-between">
        <DatePicker
          v-model:value="queryYear"
          :allow-clear="false"
          class="w-36"
          format="YYYY 年"
          picker="year"
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
      <Spin :spinning="loading">
        <Table
          :columns="columns"
          :data-source="list"
          :pagination="false"
          :scroll="{ x: 980 }"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <Button type="link" @click="openDetail(record.id)">
                {{ record.title }}
              </Button>
            </template>
            <template v-else-if="column.key === 'personalInsuranceAmount'">
              {{ formatHrmMoney(record.personalInsuranceAmount) }}
            </template>
            <template v-else-if="column.key === 'corporateInsuranceAmount'">
              {{ formatHrmMoney(record.corporateInsuranceAmount) }}
            </template>
            <template v-else-if="column.key === 'personalProvidentFundAmount'">
              {{ formatHrmMoney(record.personalProvidentFundAmount) }}
            </template>
            <template v-else-if="column.key === 'corporateProvidentFundAmount'">
              {{ formatHrmMoney(record.corporateProvidentFundAmount) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <TableAction
                :actions="[
                  {
                    label: '删除',
                    type: 'link',
                    danger: true,
                    auth: ['hrm:insurance:month-record:delete'],
                    ifShow: isLatestEditableRecord(record),
                    popConfirm: {
                      title: `确认删除“${record.title}”吗？`,
                      confirm: () => handleDelete(record),
                    },
                  },
                ]"
              />
            </template>
          </template>
        </Table>
      </Spin>
    </Card>
    <FirstMonthModal @success="handleCreateFirstSuccess" />
  </Page>
</template>
