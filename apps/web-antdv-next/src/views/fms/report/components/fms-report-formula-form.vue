<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsReportApi } from '#/api/fms/report';
import type { FmsCashFlowStatementApi } from '#/api/fms/report/cash-flow-statement';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  Alert,
  Button,
  message,
  Modal,
  Radio,
  RadioGroup,
  Select,
  Table,
  Tag,
} from 'antdv-next';

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
/** 金额字段：资产负债表为期末/年初数，其他报表为本期/本年累计金额 */
const amountFields = computed<(keyof FmsReportApi.Formula)[]>(() =>
  formulaType.value === 'balance'
    ? ['closingAmount', 'openingAmount']
    : ['currentAmount', 'yearAmount'],
);
/** 公式项表格列 */
const columns = computed<TableColumnsType>(() => [
  { title: '科目', key: 'subject', minWidth: 240 },
  {
    title: '运算符号',
    dataIndex: 'operator',
    width: 90,
    align: 'center' as const,
  },
  { title: '取数规则', key: 'rules', width: 150 },
  ...(formulaType.value === 'balance'
    ? [
        { title: '期末数', key: 'closingAmount', align: 'right' as const },
        { title: '年初数', key: 'openingAmount', align: 'right' as const },
      ]
    : [
        { title: '本期金额', key: 'currentAmount', align: 'right' as const },
        {
          title: '本年累计金额',
          key: 'yearAmount',
          align: 'right' as const,
        },
      ]),
  { title: '操作', key: 'action', width: 80, align: 'center' as const },
]);

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
    message.warning('请选择科目');
    return;
  }
  if (formulaList.value.some((item) => item.subjectId === subject.id)) {
    message.warning('科目不能重复添加');
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
    message.warning('公式中存在已失效科目，请删除后保存');
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
    message.success('保存成功');
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

/** 计算金额列合计：运算符为减号时按负数累计 */
function summaryAmount(field: keyof FmsReportApi.Formula) {
  const total = formulaList.value.reduce((result, item) => {
    const amount = Number(item[field] || 0);
    return result + (item.operator === '-' ? -amount : amount);
  }, 0);
  return formatMoney(total);
}
</script>

<template>
  <Modal
    v-model:open="dialogVisible"
    destroy-on-close
    :title="`编辑公式——${currentItem?.name || ''}`"
    width="900px"
  >
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
        <Select
          v-model:value="rules"
          class="!w-[120px]"
          :options="[...ruleOptions]"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="shrink-0 text-sm">运算符号</span>
        <RadioGroup v-model:value="operator">
          <Radio value="+">+</Radio>
          <Radio value="-">-</Radio>
        </RadioGroup>
      </div>
      <Button type="primary" @click="addFormula">添加</Button>
    </div>

    <!-- 公式项列表 -->
    <Table
      bordered
      class="mt-2"
      :columns="columns"
      :data-source="formulaList"
      :loading="loading"
      :pagination="false"
      row-key="subjectNumber"
      :scroll="{ y: 320 }"
      size="middle"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'subject'">
          {{ record.subjectNumber }} {{ record.subjectName }}
          <Tag v-if="!record.subjectId" class="ml-1.5" color="error">
            科目已失效
          </Tag>
        </template>
        <template v-else-if="column.key === 'rules'">
          {{ getRuleName(record.rules) }}
        </template>
        <template v-else-if="column.key === 'closingAmount'">
          {{ formatMoney(record.closingAmount) }}
        </template>
        <template v-else-if="column.key === 'openingAmount'">
          {{ formatMoney(record.openingAmount) }}
        </template>
        <template v-else-if="column.key === 'currentAmount'">
          {{ formatMoney(record.currentAmount) }}
        </template>
        <template v-else-if="column.key === 'yearAmount'">
          {{ formatMoney(record.yearAmount) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Button danger type="link" @click="removeFormula(index)">
            删除
          </Button>
        </template>
      </template>
      <template #summary>
        <Table.Summary>
          <Table.Summary.Row>
            <Table.Summary.Cell :index="0">合计</Table.Summary.Cell>
            <Table.Summary.Cell :index="1" />
            <Table.Summary.Cell :index="2" />
            <Table.Summary.Cell :index="3" align="right">
              {{ summaryAmount(amountFields[0]!) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="4" align="right">
              {{ summaryAmount(amountFields[1]!) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="5" />
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>

    <Alert
      class="!mt-4"
      :closable="false"
      :message="
        formulaType === 'balance'
          ? '新公式将应用于当前报表和以后尚未生成的报表，不影响其他已生成的历史报表'
          : '新公式仅应用于当前报表，不影响其他期间报表'
      "
      show-icon
      type="warning"
    />

    <template #footer>
      <Button :disabled="loading" type="primary" @click="submitForm">
        保 存
      </Button>
      <Button @click="dialogVisible = false">取 消</Button>
    </template>
  </Modal>
</template>
