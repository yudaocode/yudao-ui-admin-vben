import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsVoucherStatisticsApi } from '#/api/fms/voucher/statistics';

import { markRaw } from 'vue';

import { NumberRangeInput } from '#/components/number-range-input';
import FmsVoucherWordSelect from '#/views/fms/config/voucher-word/components/voucher-word-select.vue';
import { formatMoney } from '#/views/fms/utils/format';

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
      fieldName: 'voucherNumberRange',
      label: '凭证号',
      component: markRaw(NumberRangeInput),
      componentProps: {
        min: 1,
        precision: 0,
        minPlaceholder: '起始号',
        maxPlaceholder: '结束号',
      },
      valueFormat: splitNumberRange('minVoucherNumber', 'maxVoucherNumber'),
    },
    {
      fieldName: 'levelRange',
      label: '科目级次',
      component: markRaw(NumberRangeInput),
      defaultValue: [1, 1],
      componentProps: {
        min: 1,
        precision: 0,
        minPlaceholder: '',
        maxPlaceholder: '',
      },
      valueFormat: splitNumberRange('minLevel', 'maxLevel'),
    },
  ];
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsVoucherStatisticsApi.Statistics>['columns'] {
  return [
    {
      field: 'subjectCode',
      title: '科目编码',
      minWidth: 160,
      slots: { default: 'subjectCode' },
    },
    { field: 'subjectName', title: '科目名称', minWidth: 220 },
    {
      field: 'debitAmount',
      title: '借方金额',
      minWidth: 180,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'creditAmount',
      title: '贷方金额',
      minWidth: 180,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
  ];
}

/** 构建凭证汇总合计行，只汇总最小科目级次行，避免父子级重复累计 */
export function buildFooterMethod(getMinLevel: () => number | undefined) {
  return ({
    columns,
    data,
  }: {
    columns: Array<{ field?: string }>;
    data: FmsVoucherStatisticsApi.Statistics[];
  }) => {
    const totalRows = (data || []).filter(
      (item) => item.level === getMinLevel(),
    );
    return [
      columns.map((column, index) => {
        if (index === 0) return '总计';
        if (column.field !== 'debitAmount' && column.field !== 'creditAmount') {
          return '';
        }
        const total = totalRows.reduce(
          (sum, item) =>
            sum + Number(item[column.field as 'creditAmount' | 'debitAmount'] || 0),
          0,
        );
        return formatMoney(total);
      }),
    ];
  };
}
