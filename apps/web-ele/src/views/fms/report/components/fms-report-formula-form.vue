<script lang="ts" setup>
import type { TableColumnCtx } from 'element-plus';

import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsReportApi } from '#/api/fms/report';
import type { FmsCashFlowStatementApi } from '#/api/fms/report/cash-flow-statement';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getSubjectSimpleList } from '#/api/fms/config/subject';
import { updateBalanceSheetFormula } from '#/api/fms/report/balance-sheet';
import { updateCashFlowAdjustmentFormula } from '#/api/fms/report/cash-flow-statement';
import { updateIncomeStatementFormula } from '#/api/fms/report/income-statement';
import FmsSubjectSelect from '#/views/fms/config/subject/components/subject-select.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  FMS_FORMULA_RULE,
  FMS_SUBJECT_STATUS,
} from '#/views/fms/utils/constants';
import { formatMoney } from '#/views/fms/utils/format';

defineOptions({ name: 'FmsReportFormulaForm' });

const emit = defineEmits<{ success: [] }>();

/** 公式编辑适用的报表类型 */
type FormulaType = 'balance' | 'cash-flow' | 'income';

interface SummaryMethodProps {
  columns: TableColumnCtx<FmsReportApi.Formula>[];
  data: FmsReportApi.Formula[];
}

const fmsStore = useFmsStore(); // FMS 状态

const dialogVisible = ref(false); // 弹窗的是否展示
const loading = ref(false); // 弹窗的加载中
const formulaType = ref<FormulaType>('balance'); // 当前报表类型
const currentItem = ref<
  FmsCashFlowStatementApi.CashFlowAdjustment | FmsReportApi.ReportItem
>(); // 当前编辑的报表项目
const subjects = ref<FmsSubjectApi.Subject[]>([]); // 账套下的平铺科目列表
const formulaList = ref<FmsReportApi.Formula[]>([]); // 编辑中的公式项列表
const subjectId = ref<number>(); // 待添加的科目编号
const rules = ref<number>(FMS_FORMULA_RULE.BALANCE); // 待添加的取数规则
const operator = ref<'+' | '-'>('+'); // 待添加的运算符
const formulaRuleOptions = getDictOptions(DICT_TYPE.FMS_FORMULA_RULE, 'number');

/** 启用状态的科目 */
const enabledSubjects = computed(() =>
  subjects.value.filter(
    (subject) => subject.status === FMS_SUBJECT_STATUS.ENABLED,
  ),
);
/** 取数规则选项：资产负债表使用余额类规则，其他报表使用发生额类规则 */
const ruleOptions = computed(() =>
  formulaType.value === 'balance'
    ? formulaRuleOptions.filter((item) =>
        (
          [
            FMS_FORMULA_RULE.BALANCE,
            FMS_FORMULA_RULE.DEBIT_BALANCE,
            FMS_FORMULA_RULE.CREDIT_BALANCE,
          ] as number[]
        ).includes(item.value),
      )
    : formulaRuleOptions.filter((item) =>
        (
          [
            FMS_FORMULA_RULE.DEBIT_AMOUNT,
            FMS_FORMULA_RULE.CREDIT_AMOUNT,
            FMS_FORMULA_RULE.PROFIT_LOSS_AMOUNT,
          ] as number[]
        ).includes(item.value),
      ),
);

/** 打开弹窗 */
async function open(
  item: FmsCashFlowStatementApi.CashFlowAdjustment | FmsReportApi.ReportItem,
  type: FormulaType,
) {
  const accountSetId = fmsStore.getAccountSetId;
  if (!accountSetId) return;
  dialogVisible.value = true;
  loading.value = true;
  formulaType.value = type;
  currentItem.value = item;
  subjectId.value = undefined;
  operator.value = '+';
  rules.value =
    type === 'balance'
      ? FMS_FORMULA_RULE.BALANCE
      : FMS_FORMULA_RULE.DEBIT_AMOUNT;
  formulaList.value = parseFormula(item.formula);
  try {
    subjects.value = flattenSubjects(await getSubjectSimpleList(accountSetId));
  } finally {
    loading.value = false;
  }
}
defineExpose({ open });

/** 添加公式项 */
function addFormula() {
  const subject = subjects.value.find((item) => item.id === subjectId.value);
  if (!subject) {
    ElMessage.warning('请选择科目');
    return;
  }
  if (formulaList.value.some((item) => item.subjectId === subject.id)) {
    ElMessage.warning('科目不能重复添加');
    return;
  }
  formulaList.value.unshift({
    subjectId: subject.id,
    subjectName: subject.name,
    subjectNumber: subject.code,
    operator: operator.value,
    rules: rules.value,
    openingAmount: 0,
    closingAmount: 0,
    currentAmount: 0,
    yearAmount: 0,
  });
  subjectId.value = undefined;
}

/** 删除公式项 */
function removeFormula(index: number) {
  formulaList.value.splice(index, 1);
}

/** 提交保存 */
async function submitForm() {
  const accountSetId = fmsStore.getAccountSetId;
  if (!accountSetId || !currentItem.value) return;
  if (formulaList.value.some((item) => !item.subjectId)) {
    ElMessage.warning('公式中存在已失效科目，请删除后保存');
    return;
  }
  loading.value = true;
  try {
    const data: FmsReportApi.FormulaUpdateReq = {
      accountSetId,
      id: currentItem.value.id,
      formulas: formulaList.value.map((item) => ({
        subjectId: item.subjectId as number,
        operator: item.operator,
        rules: item.rules,
      })),
    };
    if (formulaType.value === 'balance') {
      await updateBalanceSheetFormula(data);
    } else if (formulaType.value === 'income') {
      await updateIncomeStatementFormula(data);
    } else {
      await updateCashFlowAdjustmentFormula(data);
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    emit('success');
  } finally {
    loading.value = false;
  }
}

/** 平铺科目树 */
function flattenSubjects(tree: FmsSubjectApi.Subject[]) {
  const result: FmsSubjectApi.Subject[] = [];
  const walk = (nodes: FmsSubjectApi.Subject[]) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(tree);
  return result;
}

/** 解析报表项目的公式 JSON，无法解析时返回空列表 */
function parseFormula(formula: string): FmsReportApi.Formula[] {
  try {
    const values: unknown = JSON.parse(formula);
    if (!Array.isArray(values)) return [];
    return values.filter(
      (item): item is FmsReportApi.Formula =>
        typeof item === 'object' && item !== null && 'subjectNumber' in item,
    );
  } catch {
    return [];
  }
}

/** 获得取数规则名称 */
function getRuleName(value: number) {
  return ruleOptions.value.find((item) => item.value === value)?.label || '-';
}

/** 表格合计行 */
function getSummaries({ columns, data }: SummaryMethodProps) {
  // 金额列固定在取数规则列之后：资产负债表为期末/年初数，其他报表为本期/本年累计金额
  const amountFields: (keyof FmsReportApi.Formula)[] =
    formulaType.value === 'balance'
      ? ['closingAmount', 'openingAmount']
      : ['currentAmount', 'yearAmount'];
  return columns.map((_, index) => {
    if (index === 0) return '合计';
    const field = amountFields[index - 3];
    if (!field) return '';
    const total = data.reduce((result, item) => {
      const amount = Number(item[field] || 0);
      return result + (item.operator === '-' ? -amount : amount);
    }, 0);
    return formatMoney(total);
  });
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    destroy-on-close
    :title="`编辑公式——${currentItem?.name || ''}`"
    width="900px"
  >
    <div v-loading="loading">
      <!-- 公式项编辑 -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div class="flex items-center gap-2">
          <span class="shrink-0 text-sm">科目</span>
          <FmsSubjectSelect
            v-model="subjectId"
            :options="enabledSubjects"
            class="!w-[240px]"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="shrink-0 text-sm">取数规则</span>
          <ElSelect v-model="rules" class="!w-[120px]">
            <ElOption
              v-for="option in ruleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </div>
        <div class="flex items-center gap-2">
          <span class="shrink-0 text-sm">运算符号</span>
          <ElRadioGroup v-model="operator">
            <ElRadio value="+">+</ElRadio>
            <ElRadio value="-">-</ElRadio>
          </ElRadioGroup>
        </div>
        <ElButton type="primary" @click="addFormula">添加</ElButton>
      </div>

      <!-- 公式项列表 -->
      <ElTable
        border
        class="mt-2"
        :data="formulaList"
        max-height="320"
        show-summary
        :summary-method="getSummaries"
      >
        <ElTableColumn label="科目" min-width="240">
          <template #default="{ row }">
            {{ row.subjectNumber }} {{ row.subjectName }}
            <ElTag
              v-if="!row.subjectId"
              class="ml-1.5"
              size="small"
              type="danger"
            >
              科目已失效
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          align="center"
          label="运算符号"
          prop="operator"
          width="90"
        />
        <ElTableColumn label="取数规则" width="150">
          <template #default="{ row }">{{ getRuleName(row.rules) }}</template>
        </ElTableColumn>
        <ElTableColumn
          v-if="formulaType === 'balance'"
          align="right"
          label="期末数"
        >
          <template #default="{ row }">
{{
            formatMoney(row.closingAmount)
          }}
</template>
        </ElTableColumn>
        <ElTableColumn
          v-if="formulaType === 'balance'"
          align="right"
          label="年初数"
        >
          <template #default="{ row }">
{{
            formatMoney(row.openingAmount)
          }}
</template>
        </ElTableColumn>
        <ElTableColumn
          v-if="formulaType !== 'balance'"
          align="right"
          label="本期金额"
        >
          <template #default="{ row }">
{{
            formatMoney(row.currentAmount)
          }}
</template>
        </ElTableColumn>
        <ElTableColumn
          v-if="formulaType !== 'balance'"
          align="right"
          label="本年累计金额"
        >
          <template #default="{ row }">
{{
            formatMoney(row.yearAmount)
          }}
</template>
        </ElTableColumn>
        <ElTableColumn align="center" label="操作" width="80">
          <template #default="{ $index }">
            <ElButton link type="danger" @click="removeFormula($index)">
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElAlert
        class="!mt-4"
        :closable="false"
        show-icon
        :title="
          formulaType === 'balance'
            ? '新公式将应用于当前报表和以后尚未生成的报表，不影响其他已生成的历史报表'
            : '新公式仅应用于当前报表，不影响其他期间报表'
        "
        type="warning"
      />
    </div>
    <template #footer>
      <ElButton :disabled="loading" type="primary" @click="submitForm">
        保 存
      </ElButton>
      <ElButton @click="dialogVisible = false">取 消</ElButton>
    </template>
  </ElDialog>
</template>
