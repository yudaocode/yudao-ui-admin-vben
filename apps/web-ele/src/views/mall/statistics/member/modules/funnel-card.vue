<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { onMounted, ref } from 'vue';

import { fenToYuan } from '@vben/utils';

import { ElCard, ElDatePicker } from 'element-plus';
import dayjs from 'dayjs';

import * as MemberStatisticsApi from '#/api/mall/statistics/member';
import { getRangePickerDefaultProps } from '#/utils/rangePickerProps';

/** 会员概览卡片 */
defineOptions({ name: 'MemberFunnelCard' });

const loading = ref(false);
const analyseData = ref<any>();
const dateRange = ref<[Dayjs, Dayjs]>([
  dayjs().subtract(7, 'day').startOf('day'),
  dayjs().endOf('day'),
]);

const rangePickerProps = getRangePickerDefaultProps();

/** 查询会员概览数据列表 */
async function loadData(times?: [Dayjs, Dayjs]) {
  const timesToUse = times || dateRange.value;
  if (!timesToUse || timesToUse.length !== 2) {
    return;
  }
  loading.value = true;
  try {
    analyseData.value = await MemberStatisticsApi.getMemberAnalyse({
      times: timesToUse,
    });
  } finally {
    loading.value = false;
  }
}

/** 时间范围改变 */
const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    loadData(dateRange.value);
  }
};

/** 计算环比增长率 */
const calculateRelativeRate = (value?: number, reference?: number) => {
  if (!reference || reference === 0) {
    return 0;
  }
  return (((value || 0) - reference) / reference) * 100;
};

/** 初始化 */
onMounted(() => {
  loadData();
});
</script>

<template>
  <ElCard :border="false">
    <template #header>
      <div class="flex items-center justify-between">
        <span>会员概览</span>
        <ElDatePicker
          v-model="dateRange"
          type="datetimerange"
          :shortcuts="rangePickerProps.shortcuts"
          :format="rangePickerProps.format"
          :value-format="rangePickerProps.valueFormat"
          :start-placeholder="rangePickerProps.startPlaceholder"
          :end-placeholder="rangePickerProps.endPlaceholder"
          :default-time="rangePickerProps.defaultTime"
          class="!w-[280px]"
          @change="handleDateRangeChange"
        />
      </div>
    </template>
    <div v-loading="loading" class="min-w-[900px] py-4">
      <div class="flex h-24">
        <div class="flex w-[75%] bg-blue-50">
          <div class="ml-[50px] flex flex-col justify-center">
            <div class="font-bold">
              注册用户数量：
              {{ analyseData?.comparison?.value?.registerUserCount || 0 }}
            </div>
            <div class="mt-2 text-sm">
              环比增长率：
              {{
                calculateRelativeRate(
                  analyseData?.comparison?.value?.registerUserCount,
                  analyseData?.comparison?.reference?.registerUserCount,
                ).toFixed(2)
              }}%
            </div>
          </div>
        </div>
        <div
          class="-ml-[154px] mt-1.5 flex w-[308px] flex-col items-center justify-center bg-blue-500 text-sm text-white [transform:perspective(5em)_rotateX(-11deg)]"
        >
          <span class="text-2xl font-bold">
            {{ analyseData?.visitUserCount || 0 }}
          </span>
          <span>访客</span>
        </div>
      </div>
      <div class="flex h-24">
        <div class="flex w-[75%] bg-cyan-50">
          <div class="ml-[50px] flex flex-col justify-center">
            <div class="font-bold">
              活跃用户数量：
              {{ analyseData?.comparison?.value?.visitUserCount || 0 }}
            </div>
            <div class="mt-2 text-sm">
              环比增长率：
              {{
                calculateRelativeRate(
                  analyseData?.comparison?.value?.visitUserCount,
                  analyseData?.comparison?.reference?.visitUserCount,
                ).toFixed(2)
              }}%
            </div>
          </div>
        </div>
        <div
          class="-ml-[112px] mt-[6.8px] flex h-[100px] w-[224px] flex-col items-center justify-center bg-cyan-500 text-sm text-white [transform:perspective(7em)_rotateX(-20deg)]"
        >
          <span class="text-2xl font-bold">
            {{ analyseData?.orderUserCount || 0 }}
          </span>
          <span>下单</span>
        </div>
      </div>
      <div class="flex h-24">
        <div class="flex w-[75%] bg-slate-50">
          <div class="ml-[50px] flex flex-row gap-x-16">
            <div class="flex flex-col justify-center">
              <div class="font-bold">
                充值用户数量：
                {{ analyseData?.comparison?.value?.rechargeUserCount || 0 }}
              </div>
              <div class="mt-2 text-sm">
                环比增长率：
                {{
                  calculateRelativeRate(
                    analyseData?.comparison?.value?.rechargeUserCount,
                    analyseData?.comparison?.reference?.rechargeUserCount,
                  ).toFixed(2)
                }}%
              </div>
            </div>
            <div class="flex flex-col justify-center">
              <div class="font-bold">
                客单价：{{ fenToYuan(analyseData?.atv || 0) }}
              </div>
            </div>
          </div>
        </div>
        <div
          class="-ml-[72px] mt-[13px] flex h-[92px] w-[144px] flex-col items-center justify-center bg-slate-500 text-sm text-white [transform:perspective(3em)_rotateX(-13deg)]"
        >
          <span class="text-2xl font-bold">
            {{ analyseData?.payUserCount || 0 }}
          </span>
          <span>成交用户</span>
        </div>
      </div>
    </div>
  </ElCard>
</template>
