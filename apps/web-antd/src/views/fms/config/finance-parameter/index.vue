<script lang="ts" setup>
import type { FmsAccountSetApi } from '#/api/fms/config/account-set';
import type { FmsCurrencyApi } from '#/api/fms/config/currency';
import type { FmsFinanceParameterApi } from '#/api/fms/config/finance-parameter';

import { computed, onMounted, ref, watch } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { Alert, Button, Card, Checkbox, Empty, InputNumber, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getAccountSet } from '#/api/fms/config/account-set';
import { getCurrencySimpleList } from '#/api/fms/config/currency';
import {
  getFinanceParameter,
  updateFinanceParameter,
} from '#/api/fms/config/finance-parameter';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  FMS_ACCOUNTING_STANDARD_OPTIONS,
  FMS_DEFAULT_SUBJECT_CODE_RULE,
  FMS_DEFAULT_SUBJECT_LEVEL,
  FMS_LEDGER_BALANCE_MODE,
  FMS_SUBJECT_CODE_LENGTH_MAX,
  FMS_SUBJECT_CODE_LENGTH_MIN,
  FMS_SUBJECT_LEVEL_MAX,
} from '#/views/fms/utils/constants';

import { useFormSchema } from './data';

defineOptions({ name: 'FmsFinanceParameter' });

/** 财务参数表单值 */
interface FinanceParameterFormValue {
  standard: number; // 会计制度
  level: number; // 科目级次
  subjectCodeRules: number[]; // 科目编码规则
  ledgerBalanceMode: number; // 账簿余额方向模式
  voucherReviewRequired: boolean; // 结账前是否要求凭证审核
}

const fmsStore = useFmsStore(); // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const loading = ref(false); // 页面加载中
const submitLoading = ref(false); // 提交按钮加载中
const accountSet = ref<FmsAccountSetApi.AccountSet>(); // 账套信息
const currency = ref<FmsCurrencyApi.Currency>(); // 本位币信息
const financeParameter = ref<FmsFinanceParameterApi.FinanceParameter>(); // 财务参数
const originalLevel = ref(FMS_DEFAULT_SUBJECT_LEVEL); // 原科目级次
const originalRules = ref(parseSubjectCodeRules(FMS_DEFAULT_SUBJECT_CODE_RULE)); // 原科目编码规则
const levelOptions = computed(() =>
  Array.from(
    { length: FMS_SUBJECT_LEVEL_MAX - originalLevel.value + 1 },
    (_, index) => {
      const level = originalLevel.value + index;
      return { label: `${level} 级`, value: level };
    },
  ),
); // 可选科目级次，调大后不能再调小

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    disabled: !fmsStore.isAccountSetWritable,
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: useFormSchema(() => levelOptions.value),
  showDefaultActions: false,
  handleValuesChange(values) {
    // 科目级次变化时，同步调整编码长度级数
    const level = values.level;
    const rules = values.subjectCodeRules;
    if (!level || !Array.isArray(rules) || rules.length === level) return;
    const nextRules = rules.slice(0, level);
    while (nextRules.length < level) {
      nextRules.push(FMS_SUBJECT_CODE_LENGTH_MIN);
    }
    formApi.setFieldValue('subjectCodeRules', nextRules);
  },
});

watch(accountSetId, () => getParameterData());

// 只读账套禁用整个表单
watch(
  () => fmsStore.isAccountSetWritable,
  (writable) => {
    formApi.setState({ commonConfig: { disabled: !writable } });
  },
);

/** 查询财务参数 */
async function getParameterData() {
  const currentAccountSetId = accountSetId.value;
  if (!currentAccountSetId) {
    accountSet.value = undefined;
    currency.value = undefined;
    financeParameter.value = undefined;
    resetFormData();
    return;
  }

  loading.value = true;
  try {
    // 查询账套、财务参数和币别
    const [accountSetData, financeParameterData, currencyList] =
      await Promise.all([
        getAccountSet(currentAccountSetId),
        getFinanceParameter(currentAccountSetId),
        getCurrencySimpleList(currentAccountSetId),
      ]);
    if (accountSetId.value !== currentAccountSetId) return;

    // 更新基础参数展示数据
    accountSet.value = accountSetData;
    currency.value = currencyList.find(
      (item) => item.id === accountSetData.currencyId,
    );
    financeParameter.value = financeParameterData || undefined;

    // 回显财务参数
    if (!financeParameterData) {
      resetFormData();
      await setFormValues(accountSetData, undefined);
      return;
    }
    originalLevel.value = financeParameterData.level;
    originalRules.value = parseSubjectCodeRules(
      financeParameterData.subjectCodeRule,
    );
    await setFormValues(accountSetData, financeParameterData);
  } finally {
    if (accountSetId.value === currentAccountSetId) {
      loading.value = false;
    }
  }
}

/** 回显表单 */
async function setFormValues(
  accountSetData: FmsAccountSetApi.AccountSet,
  parameter: FmsFinanceParameterApi.FinanceParameter | undefined,
) {
  await formApi.setValues({
    hasParameter: !!parameter,
    companyName: accountSetData.companyName,
    currencyName: currency.value
      ? `${currency.value.code} ${currency.value.name}`
      : '-',
    startTime: accountSetData.startTime,
    standard:
      accountSetData.standard ?? FMS_ACCOUNTING_STANDARD_OPTIONS[0].value,
    level: parameter?.level ?? FMS_DEFAULT_SUBJECT_LEVEL,
    subjectCodeRules: parameter
      ? [...originalRules.value]
      : parseSubjectCodeRules(FMS_DEFAULT_SUBJECT_CODE_RULE),
    ledgerBalanceMode:
      parameter?.ledgerBalanceMode ?? FMS_LEDGER_BALANCE_MODE.SAME_AS_SUBJECT,
    voucherReviewRequired: parameter?.voucherReviewRequired ?? true,
  });
}

/** 获得编码长度最小值 */
function getRuleMinimum(index: number) {
  return originalRules.value[index] || FMS_SUBJECT_CODE_LENGTH_MIN;
}

/** 获得表单中的编码长度列表 */
function getRuleList(modelValue: unknown): number[] {
  return Array.isArray(modelValue) ? [...(modelValue as number[])] : [];
}

/** 修改某级编码长度 */
function handleRuleChange(modelValue: unknown, index: number, value: unknown) {
  const rules = getRuleList(modelValue);
  rules[index] =
    typeof value === 'number' ? value : FMS_SUBJECT_CODE_LENGTH_MIN;
  formApi.setFieldValue('subjectCodeRules', rules);
}

/** 提交表单 */
async function submitForm() {
  if (!accountSetId.value) return;
  const { valid } = await formApi.validate();
  if (!valid) return;

  submitLoading.value = true;
  try {
    // 更新财务参数
    const values = (await formApi.getValues()) as FinanceParameterFormValue;
    await updateFinanceParameter({
      accountSetId: accountSetId.value,
      standard: values.standard,
      level: values.level,
      subjectCodeRule: values.subjectCodeRules.join('-'),
      ledgerBalanceMode: values.ledgerBalanceMode,
      voucherReviewRequired: values.voucherReviewRequired,
    });

    // 刷新财务参数
    message.success('财务参数保存成功');
    await getParameterData();
  } finally {
    submitLoading.value = false;
  }
}

/** 解析科目编码规则 */
function parseSubjectCodeRules(rule: string) {
  return rule.split('-').map(Number);
}

/** 重置表单 */
function resetFormData() {
  originalLevel.value = FMS_DEFAULT_SUBJECT_LEVEL;
  originalRules.value = parseSubjectCodeRules(FMS_DEFAULT_SUBJECT_CODE_RULE);
}

/** 初始化 */
onMounted(() => {
  getParameterData();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【设置】账套管理、财务参数、财务指标"
        url="https://doc.iocoder.cn/fms/config/account-set/"
      />
    </template>
    <Card :loading="loading" class="h-full">
      <template v-if="accountSet">
        <Form class="max-w-[960px]">
          <template #subjectCodeRules="slotProps">
            <div class="flex flex-wrap items-center gap-2">
              <template
                v-for="(rule, index) in getRuleList(
                  slotProps.componentField.modelValue,
                )"
                :key="index"
              >
                <InputNumber
                  :disabled="slotProps.disabled"
                  :max="FMS_SUBJECT_CODE_LENGTH_MAX"
                  :min="getRuleMinimum(index)"
                  :precision="0"
                  :value="rule"
                  class="!w-18"
                  @update:value="
                    (value) =>
                      handleRuleChange(
                        slotProps.componentField.modelValue,
                        index,
                        value,
                      )
                  "
                />
                <span
                  v-if="
                    index <
                    getRuleList(slotProps.componentField.modelValue).length - 1
                  "
                >
                  -
                </span>
              </template>
            </div>
          </template>
          <template #ledgerBalanceMode="slotProps">
            <Checkbox
              :checked="
                slotProps.componentField.modelValue ===
                FMS_LEDGER_BALANCE_MODE.SAME_AS_SUBJECT
              "
              :disabled="slotProps.disabled"
              @update:checked="
                (checked: boolean) =>
                  slotProps.componentField['onUpdate:modelValue'](
                    checked
                      ? FMS_LEDGER_BALANCE_MODE.SAME_AS_SUBJECT
                      : FMS_LEDGER_BALANCE_MODE.OPPOSITE_TO_SUBJECT,
                  )
              "
            >
              与科目方向相同
            </Checkbox>
          </template>
        </Form>
        <Alert
          v-if="!financeParameter"
          :message="
            accountSet.initialized
              ? '当前账套缺少财务参数，请检查初始化数据'
              : '当前账套尚未初始化，请先完成账套初始化'
          "
          type="info"
          show-icon
        />
        <Button
          v-else-if="fmsStore.isAccountSetWritable"
          v-access:code="['fms:config:finance-parameter:update']"
          type="primary"
          :loading="submitLoading"
          @click="submitForm"
        >
          保存
        </Button>
      </template>
      <Empty v-else description="请选择账套" />
    </Card>
  </Page>
</template>
