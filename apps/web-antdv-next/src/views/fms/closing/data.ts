import type { Dayjs } from 'dayjs';

import type { VbenFormSchema } from '#/adapter/form';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import FmsSubjectSelect from '#/views/fms/config/subject/components/subject-select.vue';
import FmsVoucherWordSelect from '#/views/fms/config/voucher-word/components/voucher-word-select.vue';
const formulaRuleOptions = getDictOptions(DICT_TYPE.FMS_FORMULA_RULE, 'number');
const timeTypeOptions = getDictOptions(
  DICT_TYPE.FMS_CLOSING_TIME_TYPE,
  'number',
);
const categoryOptions = getDictOptions(
  DICT_TYPE.FMS_CLOSING_TEMPLATE_CATEGORY,
  'number',
);
const voucherTypeOptions = getDictOptions(
  DICT_TYPE.FMS_CLOSING_VOUCHER_TYPE,
  'number',
);

/** 期末结转方案表单 */
export function useSchemeFormSchema(
  subjects: FmsSubjectApi.Subject[],
  voucherWords: FmsVoucherWordApi.VoucherWord[],
): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '方案名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入方案名称',
      },
    },
    {
      fieldName: 'voucherWordId',
      label: '凭证字',
      component: markRaw(FmsVoucherWordSelect),
      rules: 'selectRequired',
      componentProps: {
        options: voucherWords,
      },
    },
    {
      fieldName: 'subjectId',
      label: '来源科目',
      component: markRaw(FmsSubjectSelect),
      rules: 'selectRequired',
      componentProps: {
        options: subjects,
        placeholder: '请选择来源科目',
      },
    },
    {
      fieldName: 'formulaRule',
      label: '取数规则',
      component: 'Select',
      rules: 'selectRequired',
      componentProps: {
        options: [...formulaRuleOptions.slice(0, 3)],
        placeholder: '请选择取数规则',
      },
    },
    {
      fieldName: 'timeType',
      label: '时间类型',
      component: 'Select',
      rules: 'selectRequired',
      componentProps: {
        options: [...timeTypeOptions],
        placeholder: '请选择时间类型',
      },
    },
    {
      fieldName: 'periodEnd',
      label: '期末结转',
      component: 'Checkbox',
      formItemClass: 'col-span-2',
      renderComponentContent: () => ({
        default: () => ['用于期末结账前生成凭证'],
      }),
    },
  ];
}

/** 结账模板表单 */
export function useTemplateFormSchema(
  subjects: FmsSubjectApi.Subject[],
): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '模板名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入模板名称',
        maxlength: 255,
      },
    },
    {
      fieldName: 'category',
      label: '模板分类',
      component: 'Select',
      rules: 'selectRequired',
      componentProps: {
        options: [...categoryOptions],
        placeholder: '请选择模板分类',
      },
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      component: 'InputNumber',
      rules: z.number().min(0, '显示顺序不能小于 0').default(0),
      componentProps: {
        min: 0,
      },
    },
    {
      fieldName: 'subjectId',
      label: '来源科目',
      component: markRaw(FmsSubjectSelect),
      componentProps: {
        clearable: true,
        options: subjects,
        placeholder: '可在使用模板时补充',
      },
    },
    {
      fieldName: 'formulaRule',
      label: '取数规则',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [...formulaRuleOptions.slice(0, 3)],
        placeholder: '请选择取数规则',
      },
    },
    {
      fieldName: 'timeType',
      label: '时间类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [...timeTypeOptions],
        placeholder: '请选择时间类型',
      },
    },
    {
      fieldName: 'periodEnd',
      label: '期末结转',
      component: 'Checkbox',
      formItemClass: 'col-span-2',
      renderComponentContent: () => ({
        default: () => ['用于期末结账前生成凭证'],
      }),
    },
  ];
}

/** 结转损益参数设置表单 */
export function useProfitLossSettingsFormSchema(
  month: string,
  profitLossSubjects: FmsSubjectApi.Subject[],
  closingSubjects: FmsSubjectApi.Subject[],
  voucherWords: FmsVoucherWordApi.VoucherWord[],
): VbenFormSchema[] {
  return [
    {
      fieldName: 'voucherDate',
      label: '凭证日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        allowClear: false,
        disabledDate: (date: Dayjs) => date.format('YYYY-MM') !== month,
        format: 'YYYY年MM月DD日',
        valueFormat: 'YYYY-MM-DD',
      },
    },
    {
      fieldName: 'voucherWordId',
      label: '凭证字',
      component: markRaw(FmsVoucherWordSelect),
      rules: 'selectRequired',
      componentProps: {
        options: voucherWords,
      },
    },
    {
      fieldName: 'digest',
      label: '凭证摘要',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入凭证摘要',
      },
    },
    {
      fieldName: 'voucherType',
      label: '凭证分类',
      component: 'RadioGroup',
      rules: 'selectRequired',
      componentProps: {
        class: 'flex flex-col items-start gap-2',
        options: [...voucherTypeOptions],
      },
    },
    {
      fieldName: 'priorYearAdjustmentSubjectId',
      label: '“以前年度损益调整”科目',
      component: markRaw(FmsSubjectSelect),
      rules: 'selectRequired',
      componentProps: {
        options: profitLossSubjects,
        placeholder: '请选择科目',
      },
    },
    {
      fieldName: 'adjustmentClosingSubjectId',
      label: '“以前年度损益调整”结转科目',
      component: markRaw(FmsSubjectSelect),
      rules: 'selectRequired',
      componentProps: {
        options: closingSubjects,
        placeholder: '请选择科目',
      },
    },
    {
      fieldName: 'otherClosingSubjectId',
      label: '其他损益科目的结转科目',
      component: markRaw(FmsSubjectSelect),
      rules: 'selectRequired',
      componentProps: {
        options: closingSubjects,
        placeholder: '请选择科目',
      },
    },
    {
      fieldName: 'reverseBalance',
      label: '',
      component: 'Checkbox',
      renderComponentContent: () => ({
        default: () => ['结转方式：按余额反向结转'],
      }),
    },
  ];
}

/** 专用结转设置表单 */
export function useSpecialClosingSettingsFormSchema(
  voucherWords: FmsVoucherWordApi.VoucherWord[],
): VbenFormSchema[] {
  return [
    {
      fieldName: 'voucherWordId',
      label: '凭证字',
      component: markRaw(FmsVoucherWordSelect),
      rules: 'selectRequired',
      componentProps: {
        options: voucherWords,
      },
    },
  ];
}
