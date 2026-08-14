<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { FmsClosingPeriodApi } from '#/api/fms/closing/period';

import { computed, reactive, ref, watch } from 'vue';

import { DocAlert, confirm, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Alert, Button, Card, DatePicker, message, Spin } from 'antdv-next';
import dayjs from 'dayjs';

import {
  cancelClosePeriod,
  closePeriod,
  getClosingOverview,
} from '#/api/fms/closing/period';
import { getAccountSet } from '#/api/fms/config/account-set';
import { useFmsStore } from '#/views/fms/store/fms';
import { formatMoney } from '#/views/fms/utils/format';

import SchemeList from './components/scheme-list.vue';
import StatusCard from './components/status-card.vue';

defineOptions({ name: 'FmsClosing' });

const fmsStore = useFmsStore(); // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const month = ref(dayjs().format('YYYY-MM')); // 选中的会计期间
const currentMonth = ref(dayjs().format('YYYY-MM')); // 当前会计期间
const startMonth = ref(dayjs().format('YYYY-MM')); // 账套启用期间
const loading = ref(false); // 页面数据的加载中
const submitting = ref(false); // 结账操作的提交中
const monthLabel = computed(() =>
  dayjs(`${month.value}-01`).format('YYYY年MM月'),
); // 会计期间文本
const currentMonthLabel = computed(() =>
  dayjs(`${currentMonth.value}-01`).format('YYYY年MM月'),
); // 当前会计期间文本
const isCurrentPeriod = computed(() => month.value === currentMonth.value); // 是否当前会计期间
const overview = reactive<FmsClosingPeriodApi.ClosingOverview>({
  month: month.value,
  closed: false,
  voucherReviewRequired: false,
  pendingVoucherCount: 0,
  voucherCount: 0,
  profitLossBalance: 0,
  balanceSheetDifference: 0,
  initialBalanceBalanced: false,
  voucherNumberContinuous: false,
  profitLossVoucherGenerated: false,
  incomeStatementBalanced: false,
  incomeStatementUnmappedSubjectCount: 0,
  balanceSheetProfitLossTransferred: false,
  balanceSheetBalanced: false,
  balanceSheetUnmappedSubjectCount: 0,
  canClose: false,
}); // 结账概况
const isBeforeCurrentPeriod = computed(() =>
  dayjs(`${month.value}-01`).isBefore(dayjs(`${currentMonth.value}-01`), 'month'),
); // 是否早于当前会计期间
const canClose = computed(() => overview.canClose); // 是否满足后端全部结账条件
const balanceSheetCheckLabel = computed(() => {
  if (!overview.balanceSheetProfitLossTransferred) return '损益未结转';
  if (overview.balanceSheetUnmappedSubjectCount > 0) {
    return `${overview.balanceSheetUnmappedSubjectCount} 个科目未纳入公式`;
  }
  return overview.balanceSheetBalanced ? '检查通过' : '不平衡';
}); // 资产负债表检查结果文本

watch(accountSetId, init, { immediate: true });

/** 初始化页面 */
async function init() {
  if (!accountSetId.value) {
    return;
  }
  const [currentMonthValue, accountSet] = await Promise.all([
    fmsStore.loadCurrentMonth(),
    getAccountSet(accountSetId.value),
  ]);
  currentMonth.value = currentMonthValue || dayjs().format('YYYY-MM');
  startMonth.value = dayjs(accountSet.startTime).format('YYYY-MM');
  month.value = currentMonth.value;
  await getOverview();
}

/** 获得结账概况 */
async function getOverview() {
  if (!accountSetId.value || !month.value) return;
  loading.value = true;
  try {
    Object.assign(
      overview,
      await getClosingOverview({
        accountSetId: accountSetId.value,
        month: month.value,
      }),
    );
  } finally {
    loading.value = false;
  }
}

/** 结账 */
async function closeToPeriod() {
  if (!accountSetId.value || isBeforeCurrentPeriod.value) return;
  try {
    await confirm(
      isCurrentPeriod.value
        ? `结账后将锁定 ${monthLabel.value}，是否继续？`
        : `将按期间顺序结账至 ${monthLabel.value}，是否继续？`,
    );
  } catch {
    return;
  }
  submitting.value = true;
  try {
    await closePeriod({
      accountSetId: accountSetId.value,
      month: month.value,
    });
    message.success('结账成功');
    currentMonth.value =
      (await fmsStore.loadCurrentMonth()) || currentMonth.value;
    month.value = currentMonth.value;
    await getOverview();
  } finally {
    submitting.value = false;
  }
}

/** 反结账 */
async function cancelToPeriod() {
  if (!accountSetId.value || !overview.closed) return;
  try {
    await confirm(
      `反结账会影响历史报表数据，将撤销 ${monthLabel.value} 及之后的结账，确认继续吗？`,
    );
  } catch {
    return;
  }
  submitting.value = true;
  try {
    await cancelClosePeriod({
      accountSetId: accountSetId.value,
      month: month.value,
    });
    message.success('反结账成功');
    currentMonth.value =
      (await fmsStore.loadCurrentMonth()) || currentMonth.value;
    month.value = currentMonth.value;
    await getOverview();
  } finally {
    submitting.value = false;
  }
}

/** 禁用账套启用前和可操作范围外的月份 */
function disabledMonth(date: Dayjs) {
  const selectedMonth = date.startOf('month');
  const latestSelectableMonth = dayjs().startOf('month');
  return (
    selectedMonth.isBefore(dayjs(`${startMonth.value}-01`), 'month') ||
    selectedMonth.isAfter(latestSelectableMonth, 'month')
  );
}
</script>

<template>
  <Page>
    <template #doc>
      <DocAlert
        title="【结账】期末结账"
        url="https://doc.iocoder.cn/fms/closing/"
      />
    </template>
    <!-- 会计期间 -->
    <Card class="mb-4">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="shrink-0">会计期间</span>
          <DatePicker
            v-model:value="month"
            :allow-clear="false"
            :disabled-date="disabledMonth"
            format="YYYY年MM月"
            picker="month"
            value-format="YYYY-MM"
            @change="getOverview"
          />
        </div>
        <Button :loading="loading" @click="getOverview">
          <IconifyIcon class="mr-1" icon="lucide:refresh-cw" />刷新
        </Button>
      </div>
    </Card>

    <!-- 期末结转方案 -->
    <SchemeList
      v-if="accountSetId"
      :account-set-id="accountSetId"
      :closed="overview.closed"
      :current-period="isCurrentPeriod"
      :month="month"
      :profit-loss-balance="overview.profitLossBalance"
      :voucher-count="overview.voucherCount"
      @success="getOverview"
    />

    <!-- 结账检查 -->
    <Card class="mb-4">
      <Alert
        :message="overview.closed ? `${monthLabel} 已结账` : `${monthLabel} 尚未结账`"
        :type="overview.closed ? 'success' : 'info'"
        class="!mb-4"
        show-icon
      />
      <Spin :spinning="loading">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            :tag-label="
              overview.voucherReviewRequired ? '结账前必须审核' : '当前未强制审核'
            "
            :tag-type="
              !overview.voucherReviewRequired || overview.pendingVoucherCount === 0
                ? 'success'
                : 'danger'
            "
            :value="`${overview.pendingVoucherCount} 张待审核`"
            title="凭证审核"
          />
          <StatusCard
            :tag-label="overview.initialBalanceBalanced ? '检查通过' : '需要处理'"
            :tag-type="overview.initialBalanceBalanced ? 'success' : 'danger'"
            :value="overview.initialBalanceBalanced ? '试算平衡' : '试算不平衡'"
            title="初始余额"
          />
          <StatusCard
            :tag-label="overview.voucherNumberContinuous ? '检查通过' : '需要整理'"
            :tag-type="overview.voucherNumberContinuous ? 'success' : 'danger'"
            :value="overview.voucherNumberContinuous ? '编号连续' : '存在断号'"
            title="凭证编号"
          />
          <StatusCard
            :tag-label="
              !overview.profitLossVoucherGenerated
                ? '未生成结转凭证'
                : overview.profitLossBalance === 0
                  ? '已结平'
                  : '待结转'
            "
            :tag-type="
              overview.profitLossVoucherGenerated && overview.profitLossBalance === 0
                ? 'success'
                : 'warning'
            "
            :value="formatMoney(overview.profitLossBalance)"
            title="损益结转"
          />
          <StatusCard
            :tag-label="
              overview.incomeStatementBalanced &&
              overview.incomeStatementUnmappedSubjectCount === 0
                ? '检查通过'
                : '需要处理'
            "
            :tag-type="
              overview.incomeStatementBalanced &&
              overview.incomeStatementUnmappedSubjectCount === 0
                ? 'success'
                : 'danger'
            "
            :value="
              overview.incomeStatementUnmappedSubjectCount
                ? `${overview.incomeStatementUnmappedSubjectCount} 个科目未纳入公式`
                : overview.incomeStatementBalanced
                  ? '勾稽平衡'
                  : '勾稽不平衡'
            "
            title="利润表检查"
          />
          <StatusCard
            :tag-label="balanceSheetCheckLabel"
            :tag-type="
              overview.balanceSheetProfitLossTransferred &&
              overview.balanceSheetBalanced &&
              overview.balanceSheetUnmappedSubjectCount === 0
                ? 'success'
                : 'danger'
            "
            :value="`差额 ${formatMoney(overview.balanceSheetDifference)}`"
            title="资产负债平衡"
          />
          <StatusCard
            :tag-label="overview.closed ? '账簿已锁定' : '允许继续记账'"
            :tag-type="overview.closed ? 'success' : 'info'"
            :value="overview.closed ? '已结账' : '未结账'"
            title="期间状态"
          />
        </div>
      </Spin>
    </Card>

    <!-- 执行结账 -->
    <Card title="执行结账">
      <div class="flex flex-wrap items-center gap-3">
        <Button
          v-if="
            fmsStore.isAccountSetWritable &&
            !overview.closed &&
            !isBeforeCurrentPeriod
          "
          v-access:code="['fms:closing:close']"
          :disabled="!canClose"
          :loading="submitting"
          type="primary"
          @click="closeToPeriod"
        >
          {{ isCurrentPeriod ? '结账' : `结账到 ${monthLabel}` }}
        </Button>
        <Button
          v-if="fmsStore.isAccountSetWritable && overview.closed"
          v-access:code="['fms:closing:cancel']"
          :loading="submitting"
          danger
          @click="cancelToPeriod"
        >
          {{ isCurrentPeriod ? '反结账' : `反结账到 ${monthLabel}` }}
        </Button>
        <span
          v-if="!overview.closed && !isBeforeCurrentPeriod && !canClose"
          class="text-warning"
        >
          完成上方检查后才可结账
        </span>
        <span
          v-if="!overview.closed && isBeforeCurrentPeriod"
          class="text-warning"
        >
          结账目标不能早于当前会计期间 {{ currentMonthLabel }}
        </span>
      </div>
    </Card>
  </Page>
</template>
