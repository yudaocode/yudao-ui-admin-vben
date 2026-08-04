<script lang="ts" setup>
import type { HrmPortalInsuranceRecordApi } from '#/api/hrm/portal/insurance/record';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import dayjs from 'dayjs';
import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElEmpty,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { getInsuranceRecordList } from '#/api/hrm/portal/insurance/record';
import { DictTag } from '#/components/dict-tag';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';
import { formatHrmMoney } from '#/views/hrm/utils/format';

import InsuranceRecordDetail from './InsuranceRecordDetail.vue';

defineOptions({ name: 'HrmPortalInsurance' });

const router = useRouter();
const accessible = ref(false);
const loading = ref(false);
const year = ref<Date>(dayjs().startOf('year').toDate());
const firstYear = ref<number>();
const allRecords = ref<HrmPortalInsuranceRecordApi.PortalInsuranceRecord[]>([]);
const records = ref<HrmPortalInsuranceRecordApi.PortalInsuranceRecord[]>([]);
const detailRef = ref<InstanceType<typeof InsuranceRecordDetail>>();

/** 加载参保记录 */
function loadRecords() {
  records.value = allRecords.value.filter(
    (record) => record.year === dayjs(year.value).year(),
  );
}

/** 年份是否不可选择 */
function isYearDisabled(date: Date) {
  return firstYear.value !== undefined && dayjs(date).year() < firstYear.value;
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
        .startOf('year')
        .toDate();
    }
    loadRecords();
  } finally {
    loading.value = false;
  }
}

/** 计算参保记录合计 */
function recordTotal(
  record?: HrmPortalInsuranceRecordApi.PortalInsuranceRecord,
) {
  return (
    (record?.personalInsuranceAmount || 0) +
    (record?.corporateInsuranceAmount || 0) +
    (record?.personalProvidentFundAmount || 0) +
    (record?.corporateProvidentFundAmount || 0)
  );
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
    <div v-loading="loading">
      <ElCard class="mb-4" shadow="never">
        <div class="flex items-center justify-between text-lg font-semibold">
          <span>社保管理</span>
          <ElDatePicker
            v-model="year"
            :clearable="false"
            :disabled-date="isYearDisabled"
            class="!w-[120px]"
            type="year"
            @change="loadRecords"
          />
        </div>
      </ElCard>

      <ElCard v-if="records.length" shadow="never">
        <ElTable border :data="records" row-key="id" size="small">
          <ElTableColumn fixed="left" label="所属月份" width="110">
            <template #default="{ row }">
              {{ row.year }}-{{ String(row.month).padStart(2, '0') }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="参保方案" min-width="210" prop="schemeName">
            <template #default="{ row }">
              <div>{{ row.schemeName || '-' }}</div>
              <div
                v-if="row.schemeCity"
                class="text-muted-foreground mt-1 text-xs"
              >
                {{ row.schemeCity }}
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn
            align="center"
            label="方案类型"
            prop="schemeType"
            width="100"
          >
            <template #default="{ row }">
              <DictTag
                v-if="row.schemeType"
                type="hrm_insurance_scheme_type"
                :value="row.schemeType"
              />
              <span v-else>-</span>
            </template>
          </ElTableColumn>
          <ElTableColumn
            align="right"
            label="个人社保"
            min-width="130"
            prop="personalInsuranceAmount"
          >
            <template #default="{ row }">
              ¥ {{ formatHrmMoney(row.personalInsuranceAmount) }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            align="right"
            label="公司社保"
            min-width="130"
            prop="corporateInsuranceAmount"
          >
            <template #default="{ row }">
              ¥ {{ formatHrmMoney(row.corporateInsuranceAmount) }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            align="right"
            label="个人公积金"
            min-width="130"
            prop="personalProvidentFundAmount"
          >
            <template #default="{ row }">
              ¥ {{ formatHrmMoney(row.personalProvidentFundAmount) }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            align="right"
            label="公司公积金"
            min-width="130"
            prop="corporateProvidentFundAmount"
          >
            <template #default="{ row }">
              ¥ {{ formatHrmMoney(row.corporateProvidentFundAmount) }}
            </template>
          </ElTableColumn>
          <ElTableColumn align="right" label="合计" min-width="140">
            <template #default="{ row }">
              <b class="text-primary">
                ¥
                {{
                  formatHrmMoney(
                    recordTotal(
                      row as HrmPortalInsuranceRecordApi.PortalInsuranceRecord,
                    ),
                  )
                }}
              </b>
            </template>
          </ElTableColumn>
          <ElTableColumn align="center" fixed="right" label="操作" width="100">
            <template #default="{ row }">
              <ElButton
                link
                type="primary"
                @click="
                  openDetail(
                    row as HrmPortalInsuranceRecordApi.PortalInsuranceRecord,
                  )
                "
              >
                查看详情
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>
      <ElCard v-else shadow="never">
        <ElEmpty description="暂无社保数据" />
      </ElCard>

      <InsuranceRecordDetail ref="detailRef" />
    </div>
  </Page>
</template>
