<script lang="ts" setup>
import type { FmsBalanceSheetApi } from '#/api/fms/report/balance-sheet';
import type { FmsCashFlowStatementApi } from '#/api/fms/report/cash-flow-statement';
import type { FmsIncomeStatementApi } from '#/api/fms/report/income-statement';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Alert, Button } from 'ant-design-vue';

import { FMS_REPORT_TYPE } from '#/views/fms/utils/constants';
import { formatMoney } from '#/views/fms/utils/format';

defineOptions({ name: 'FmsReportCheckAlert' });

const props = defineProps<{
  reportType: number; // 报表类型，值为 FMS_REPORT_TYPE
  result?: FmsReportCheckResult;
}>();

/** 各报表检查结果的并集，页面按自身报表类型传入对应检查结果 */
interface FmsReportCheckResult
  extends FmsBalanceSheetApi.BalanceSheetCheck,
    FmsCashFlowStatementApi.CashFlowCheck,
    FmsIncomeStatementApi.IncomeStatementCheck {}

const router = useRouter();

/** 报表名称 */
const reportName = computed(() => {
  if (props.reportType === FMS_REPORT_TYPE.INCOME_STATEMENT) return '利润表';
  if (props.reportType === FMS_REPORT_TYPE.CASH_FLOW_STATEMENT)
    return '现金流量表';
  return '资产负债表';
});
/** 检查是否全部通过 */
const passed = computed(() => {
  if (!props.result) return false;
  if (props.reportType === FMS_REPORT_TYPE.CASH_FLOW_STATEMENT) {
    return props.result.balanceSheetReady === true;
  }
  return (
    props.result.balanced === true &&
    !props.result.unmappedSubjects.length &&
    (props.reportType === FMS_REPORT_TYPE.INCOME_STATEMENT ||
      (props.result.initialBalanceBalanced === true &&
        props.result.profitLossTransferred === true))
  );
});
/** 未映射科目摘要，最多展示前 5 个 */
const unmappedSubjectText = computed(() => {
  const subjects = props.result?.unmappedSubjects || [];
  const text = subjects
    .slice(0, 5)
    .map((subject) => `${subject.code} ${subject.name}`)
    .join('、');
  return subjects.length > 5 ? `${text} 等` : text;
});

/** 格式化差额绝对值 */
function formatCheckAmount(amount?: number) {
  return formatMoney(Math.abs(Number(amount || 0))) || '0.00';
}
</script>

<template>
  <Alert
    v-if="result"
    class="mb-3 shrink-0"
    :closable="false"
    :type="passed ? 'success' : 'warning'"
    show-icon
  >
    <template #message>
      {{ passed ? `${reportName}检查通过` : `${reportName}检查发现问题` }}
    </template>
    <template v-if="!passed" #description>
      <div class="mt-1.5 flex flex-col gap-1.5">
        <div
          v-if="
            result.balanced === false &&
            reportType !== FMS_REPORT_TYPE.INCOME_STATEMENT
          "
        >
          资产负债表不平衡：年初差额
          {{ formatCheckAmount(result.openingDifferenceAmount) }}，期末差额
          {{ formatCheckAmount(result.closingDifferenceAmount) }}
          <Button
            v-if="reportType === FMS_REPORT_TYPE.CASH_FLOW_STATEMENT"
            class="!h-auto !p-0 align-baseline"
            type="link"
            @click="router.push('/fms/report/balance-sheet')"
          >
            查看资产负债表
          </Button>
        </div>
        <div
          v-if="
            result.balanced === false &&
            reportType === FMS_REPORT_TYPE.INCOME_STATEMENT
          "
        >
          净利润与未分配利润变动不一致，勾稽差额
          {{ formatCheckAmount(result.differenceAmount) }}
          <Button
            class="!h-auto !p-0 align-baseline"
            type="link"
            @click="router.push('/fms/report/balance-sheet')"
          >
            查看资产负债表
          </Button>
        </div>
        <div v-if="result.initialBalanceBalanced === false">
          初始余额试算不平衡
          <Button
            class="!h-auto !p-0 align-baseline"
            type="link"
            @click="router.push('/fms/config/initial-balance')"
          >
            处理初始余额
          </Button>
        </div>
        <div v-if="result.profitLossTransferred === false">
          查询期间存在尚未结转的损益余额
          <Button
            class="!h-auto !p-0 align-baseline"
            type="link"
            @click="router.push('/fms/closing/period')"
          >
            前往结转损益
          </Button>
        </div>
        <div v-if="result.unmappedSubjects.length">
          {{ result.unmappedSubjects.length }} 个一级科目尚未纳入报表公式：{{
            unmappedSubjectText
          }}
          <Button
            v-if="reportType === FMS_REPORT_TYPE.CASH_FLOW_STATEMENT"
            class="!h-auto !p-0 align-baseline"
            type="link"
            @click="router.push('/fms/report/balance-sheet')"
          >
            查看报表公式
          </Button>
          <span v-else>，请编辑当前报表公式</span>
        </div>
      </div>
    </template>
  </Alert>
</template>
