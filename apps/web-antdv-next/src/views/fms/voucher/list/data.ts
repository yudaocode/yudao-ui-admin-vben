import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsVoucherApi } from '#/api/fms/voucher';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate } from '@vben/utils';

import { NumberRangeInput } from '#/components/number-range-input';
import FmsSubjectSelect from '#/views/fms/config/subject/components/subject-select.vue';
import FmsVoucherWordSelect from '#/views/fms/config/voucher-word/components/voucher-word-select.vue';
import { FMS_VOUCHER_TIDY_TYPE } from '#/views/fms/utils/constants';
import { UserSelect } from '#/views/system/user/components';

const voucherStatusOptions = getDictOptions(
  DICT_TYPE.FMS_VOUCHER_STATUS,
  'number',
);

/** 拆分数字区间到最小/最大查询字段 */
function splitNumberRange(minFieldName: string, maxFieldName: string) {
  return (
    value: [number | undefined, number | undefined] | undefined,
    setValue: (fieldName: string, value: number | undefined) => void,
  ) => {
    setValue(minFieldName, value?.[0]);
    setValue(maxFieldName, value?.[1]);
    return undefined;
  };
}

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'monthRange',
      label: '会计期间',
      component: 'RangePicker',
      componentProps: {
        allowClear: false,
        picker: 'month',
        placeholder: ['开始月份', '结束月份'],
        valueFormat: 'YYYY-MM',
      },
    },
    {
      fieldName: 'voucherWordId',
      label: '凭证字',
      component: markRaw(FmsVoucherWordSelect),
      // FmsVoucherWordSelect 使用 modelValue 绑定，antd 适配层默认 v-model:value
      modelPropName: 'modelValue',
      componentProps: {
        clearable: true,
        options: [],
        placeholder: '请选择凭证字',
      },
    },
    {
      fieldName: 'voucherNumber',
      label: '凭证号',
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 1,
        placeholder: '请输入凭证号',
      },
    },
    {
      fieldName: 'digest',
      label: '摘要',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入摘要',
      },
    },
    {
      fieldName: 'subjectId',
      label: '科目',
      component: markRaw(FmsSubjectSelect),
      // FmsSubjectSelect 使用 modelValue 绑定，antd 适配层默认 v-model:value
      modelPropName: 'modelValue',
      componentProps: {
        clearable: true,
        placeholder: '请选择科目',
      },
    },
    {
      fieldName: 'amountRange',
      label: '金额',
      component: markRaw(NumberRangeInput),
      componentProps: {
        min: 0,
        precision: 2,
        minPlaceholder: '最小金额',
        maxPlaceholder: '最大金额',
      },
      valueFormat: splitNumberRange('minAmount', 'maxAmount'),
    },
    {
      fieldName: 'creatorUserId',
      label: '制单人',
      component: markRaw(UserSelect),
      // UserSelect 使用 modelValue 绑定，antd 适配层默认 v-model:value
      modelPropName: 'modelValue',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: voucherStatusOptions,
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表字段 */
export function useGridColumns(
  showSelection: boolean,
): VxeTableGridOptions<FmsVoucherApi.Voucher>['columns'] {
  return [
    ...(showSelection ? [{ type: 'checkbox' as const, width: 46 }] : []),
    {
      field: 'voucherTime',
      title: '日期',
      width: 110,
      align: 'center',
      formatter: ({ cellValue }) => formatDate(cellValue, 'YYYY-MM-DD'),
    },
    {
      field: 'voucherWordName',
      title: '凭证字号',
      width: 110,
      align: 'center',
      slots: { default: 'voucherWord' },
    },
    {
      field: 'attachmentUrls',
      title: '附件',
      width: 72,
      align: 'center',
      slots: { default: 'attachment' },
    },
    {
      field: 'entries',
      title: '摘要',
      minWidth: 190,
      slots: { default: 'digest' },
    },
    {
      field: 'subjectNames',
      title: '会计科目',
      minWidth: 230,
      slots: { default: 'subject' },
    },
    {
      field: 'debitAmount',
      title: '借方金额',
      width: 135,
      align: 'right',
      slots: { default: 'debit' },
    },
    {
      field: 'creditAmount',
      title: '贷方金额',
      width: 135,
      align: 'right',
      slots: { default: 'credit' },
    },
    {
      field: 'creatorUserName',
      title: '制单人',
      width: 100,
      align: 'center',
    },
    {
      field: 'reviewerUserName',
      title: '审核人',
      width: 100,
      align: 'center',
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      align: 'center',
      slots: { default: 'status' },
    },
    {
      field: 'actions',
      title: '操作',
      width: 250,
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 整理凭证表单 */
export function useTidyFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'month',
      label: '整理范围',
      component: 'DatePicker',
      componentProps: {
        allowClear: false,
        class: 'w-full',
        picker: 'month',
        placeholder: '请选择月份',
        valueFormat: 'YYYY-MM',
      },
      rules: 'required',
    },
    {
      fieldName: 'voucherWordId',
      label: '凭证字',
      component: markRaw(FmsVoucherWordSelect),
      // FmsVoucherWordSelect 使用 modelValue 绑定，antd 适配层默认 v-model:value
      modelPropName: 'modelValue',
      componentProps: {
        options: [],
        placeholder: '请选择凭证字',
      },
      rules: 'required',
    },
    {
      fieldName: 'startNumber',
      label: '起始编号',
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 1,
        placeholder: '请输入起始编号',
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: ' ',
      component: 'RadioGroup',
      componentProps: {
        class: 'flex flex-col items-start',
        options: [
          {
            label: '按凭证号顺次前移补齐断号',
            value: FMS_VOUCHER_TIDY_TYPE.FILL_GAPS,
          },
          {
            label: '按凭证日期重新顺次编号',
            value: FMS_VOUCHER_TIDY_TYPE.REORDER_BY_TIME,
          },
        ],
      },
      defaultValue: FMS_VOUCHER_TIDY_TYPE.FILL_GAPS,
      rules: 'required',
    },
  ];
}

/** 移动凭证表单 */
export function useMoveFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'month',
      label: '期间',
      component: 'DatePicker',
      componentProps: {
        allowClear: false,
        class: 'w-full',
        picker: 'month',
        placeholder: '请选择期间',
        valueFormat: 'YYYY-MM',
      },
      rules: 'required',
    },
    {
      fieldName: 'voucherWordId',
      label: '凭证字',
      component: markRaw(FmsVoucherWordSelect),
      // FmsVoucherWordSelect 使用 modelValue 绑定，antd 适配层默认 v-model:value
      modelPropName: 'modelValue',
      componentProps: {
        options: [],
        placeholder: '请选择凭证字',
      },
      rules: 'required',
    },
    {
      fieldName: 'sourceNumber',
      label: '原凭证号',
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 1,
        placeholder: '请输入原凭证号',
      },
      rules: 'required',
    },
    {
      fieldName: 'targetNumber',
      label: '移动到的凭证号',
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 1,
        placeholder: '移动到该凭证号之前',
      },
      rules: 'required',
    },
  ];
}
