<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { HrmPortalInsuranceRecordApi } from '#/api/hrm/portal/insurance/record';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { Button, Card, DatePicker, Empty, Spin, Table } from 'antdv-next';
import dayjs from 'dayjs';

import { getInsuranceRecordList } from '#/api/hrm/portal/insurance/record';
import { DictTag } from '#/components/dict-tag';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';
import { formatHrmMoney } from '#/views/hrm/utils/format';

import InsuranceRecordDetail from './InsuranceRecordDetail.vue';

defineOptions({ name: 'HrmPortalInsurance' });

const router = useRouter();
const accessible = ref(false);
const loading = ref(false);
const year = ref<Dayjs>(dayjs());
const firstYear = ref<number>();
const allRecords = ref<HrmPortalInsuranceRecordApi.PortalInsuranceRecord[]>([]);
const records = ref<HrmPortalInsuranceRecordApi.PortalInsuranceRecord[]>([]);
const detailRef = ref<InstanceType<typeof InsuranceRecordDetail>>();

const columns = [
  {
    title: '所属月份',
    dataIndex: 'monthLabel',
    key: 'monthLabel',
    width: 110,
    fixed: 'left' as const,
  },
  {
    title: '参保方案',
    dataIndex: 'schemeName',
    key: 'schemeName',
    minWidth: 210,
  },
  {
    title: '方案类型',
    dataIndex: 'schemeType',
    key: 'schemeType',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '个人社保',
    dataIndex: 'personalInsuranceAmount',
    key: 'personalInsuranceAmount',
    minWidth: 130,
    align: 'right' as const,
  },
  {
    title: '公司社保',
    dataIndex: 'corporateInsuranceAmount',
    key: 'corporateInsuranceAmount',
    minWidth: 130,
    align: 'right' as const,
  },
  {
    title: '个人公积金',
    dataIndex: 'personalProvidentFundAmount',
    key: 'personalProvidentFundAmount',
    minWidth: 130,
    align: 'right' as const,
  },
  {
    title: '公司公积金',
    dataIndex: 'corporateProvidentFundAmount',
    key: 'corporateProvidentFundAmount',
    minWidth: 130,
    align: 'right' as const,
  },
  {
    title: '合计',
    dataIndex: 'totalAmount',
    key: 'totalAmount',
    minWidth: 140,
    align: 'right' as const,
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];

/** 加载参保记录 */
function loadRecords() {
  records.value = allRecords.value.filter(
    (record) => record.year === year.value.year(),
  );
}

/** 年份是否不可选择 */
function isYearDisabled(current: Dayjs) {
  return firstYear.value !== undefined && current.year() < firstYear.value;
}

/** 初始化社保记录 */
async function init() {
  loading.value = true;
  try {
    allRecords.value = (await getInsuranceRecordList()) || [];
    const years = allRecords.value.map((record) => record.year);
    if (years.length > 0) {
      firstYear.value = Math.min(...years);
      year.value = dayjs()
        .year(Math.max(...years))
        .startOf('year');
    }
    loadRecords();
  } finally {
    loading.value = false;
  }
}

/** 计算个人缴纳合计 */
function personalTotal(
  record?: HrmPortalInsuranceRecordApi.PortalInsuranceRecord,
) {
  return (
    (record?.personalInsuranceAmount || 0) +
    (record?.personalProvidentFundAmount || 0)
  );
}

/** 计算公司缴纳合计 */
function corporateTotal(
  record?: HrmPortalInsuranceRecordApi.PortalInsuranceRecord,
) {
  return (
    (record?.corporateInsuranceAmount || 0) +
    (record?.corporateProvidentFundAmount || 0)
  );
}

/** 计算参保记录合计 */
function recordTotal(
  record?: HrmPortalInsuranceRecordApi.PortalInsuranceRecord,
) {
  return personalTotal(record) + corporateTotal(record);
}

/** 打开详情 */
function openDetail(record: HrmPortalInsuranceRecordApi.PortalInsuranceRecord) {
  detailRef.value?.open(record);
}

/** 页面激活时刷新参保记录 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  if (!accessible.value) {
    return;
  }
  await init();
});
</script>

<template>
  <Page v-if="accessible">
    <Spin :spinning="loading">
      <Card class="mb-4">
        <div class="flex items-center justify-between text-lg font-semibold">
          <span>社保管理</span>
          <DatePicker
            v-model:value="year"
            :allow-clear="false"
            class="w-[120px]"
            :disabled-date="isYearDisabled"
            picker="year"
            @change="loadRecords"
          />
        </div>
      </Card>

      <Card v-if="records.length">
        <Table
          bordered
          :columns="columns"
          :data-source="records"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 1200 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'monthLabel'">
              {{ record.year }}-{{ String(record.month).padStart(2, '0') }}
            </template>
            <template v-else-if="column.key === 'schemeName'">
              <div>{{ record.schemeName || '-' }}</div>
              <div
                v-if="record.schemeCity"
                class="text-muted-foreground mt-1 text-xs"
              >
                {{ record.schemeCity }}
              </div>
            </template>
            <template v-else-if="column.key === 'schemeType'">
              <DictTag
                v-if="record.schemeType"
                :type="DICT_TYPE.HRM_INSURANCE_SCHEME_TYPE"
                :value="record.schemeType"
              />
              <span v-else>-</span>
            </template>
            <template v-else-if="column.key === 'personalInsuranceAmount'">
              ¥ {{ formatHrmMoney(record.personalInsuranceAmount) }}
            </template>
            <template v-else-if="column.key === 'corporateInsuranceAmount'">
              ¥ {{ formatHrmMoney(record.corporateInsuranceAmount) }}
            </template>
            <template v-else-if="column.key === 'personalProvidentFundAmount'">
              ¥ {{ formatHrmMoney(record.personalProvidentFundAmount) }}
            </template>
            <template v-else-if="column.key === 'corporateProvidentFundAmount'">
              ¥ {{ formatHrmMoney(record.corporateProvidentFundAmount) }}
            </template>
            <template v-else-if="column.key === 'totalAmount'">
              <b class="text-primary">
                ¥ {{ formatHrmMoney(recordTotal(record)) }}
              </b>
            </template>
            <template v-else-if="column.key === 'action'">
              <Button type="link" @click="openDetail(record)">查看详情</Button>
            </template>
          </template>
        </Table>
      </Card>
      <Card v-else><Empty description="暂无社保数据" /></Card>

      <InsuranceRecordDetail ref="detailRef" />
    </Spin>
  </Page>
</template>
