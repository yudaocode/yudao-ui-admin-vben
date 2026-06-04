import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';
import type { NumberRangeValue } from '#/components/number-range-input';

import { h, markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, formatDateTime } from '@vben/utils';

import { z } from '#/adapter/form';
import { getSimpleUserList } from '#/api/system/user';
import { DictTag } from '#/components/dict-tag';
import {
  buildNumberRangeSchema,
  NumberRangeInput,
} from '#/components/number-range-input';
import { getRangePickerDefaultProps } from '#/utils';
import { WmsWarehouseSelect } from '#/views/wms/md/warehouse/components';
import {
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  getLossClass,
  PRICE_PRECISION,
  QUANTITY_PRECISION,
  roundPrice,
  sumPrice,
  sumQuantity,
} from '#/views/wms/utils/format';

/** 表单类型 */
export type FormType = 'create' | 'update';

/** 拆分数量/金额区间字段，适配后端 Min/Max 查询参数 */
function splitNumberRange(minFieldName: string, maxFieldName: string) {
  return (
    value: NumberRangeValue | undefined,
    setValue: (fieldName: string, value: number | undefined) => void,
  ) => {
    setValue(minFieldName, value?.[0]);
    setValue(maxFieldName, value?.[1]);
    return undefined;
  };
}

/** 构建允许负数的区间搜索项，盘库盈亏数量需要支持盘亏 */
function buildSignedNumberRangeSchema(
  label: string,
  fieldName: string,
  minFieldName: string,
  maxFieldName: string,
  precision: number,
): VbenFormSchema {
  return {
    component: markRaw(NumberRangeInput),
    componentProps: {
      precision,
    },
    fieldName,
    label,
    valueFormat: splitNumberRange(minFieldName, maxFieldName),
  };
}

/** 计算单据盈亏金额 */
export function getOrderDifferencePrice(order: {
  actualPrice?: number;
  totalPrice?: number;
}) {
  return roundPrice(
    Number(order.actualPrice || 0) - Number(order.totalPrice || 0),
  );
}

/** 计算明细盈亏数量 */
export function getDetailDifferenceQuantity(detail: {
  checkQuantity?: number;
  quantity?: number;
}) {
  return Number(detail.checkQuantity || 0) - Number(detail.quantity || 0);
}

/** 计算明细实际金额 */
export function getDetailActualPrice(detail: {
  checkQuantity?: number;
  price?: number;
}) {
  if (
    detail.checkQuantity === undefined ||
    detail.checkQuantity === null ||
    detail.price === undefined ||
    detail.price === null
  ) {
    return undefined;
  }
  return roundPrice(Number(detail.checkQuantity) * Number(detail.price));
}

/** 计算明细盈亏金额 */
export function getDetailDifferencePrice(detail: {
  checkQuantity?: number;
  price?: number;
  quantity?: number;
}) {
  if (detail.price === undefined || detail.price === null) {
    return undefined;
  }
  return roundPrice(getDetailDifferenceQuantity(detail) * Number(detail.price));
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入盘库单号',
      },
      fieldName: 'no',
      label: '盘库单号',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.WMS_ORDER_STATUS, 'number'),
        placeholder: '请选择单据状态',
      },
      fieldName: 'status',
      label: '单据状态',
    },
    {
      component: markRaw(WmsWarehouseSelect),
      fieldName: 'warehouseId',
      label: '仓库',
    },
    {
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
      fieldName: 'orderTime',
      label: '单据日期',
    },
    buildSignedNumberRangeSchema(
      '盈亏数量',
      'totalQuantityRange',
      'totalQuantityMin',
      'totalQuantityMax',
      QUANTITY_PRECISION,
    ),
    buildNumberRangeSchema(
      '总金额',
      'totalPriceRange',
      'totalPriceMin',
      'totalPriceMax',
      PRICE_PRECISION,
    ),
    buildNumberRangeSchema(
      '实际金额',
      'actualPriceRange',
      'actualPriceMin',
      'actualPriceMax',
      PRICE_PRECISION,
    ),
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择创建用户',
        showSearch: true,
        valueField: 'id',
      },
      fieldName: 'creator',
      label: '创建用户',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择更新用户',
        showSearch: true,
        valueField: 'id',
      },
      fieldName: 'updater',
      label: '更新用户',
    },
    {
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
      fieldName: 'createTime',
      label: '创建时间',
    },
    {
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
      fieldName: 'updateTime',
      label: '更新时间',
    },
  ];
}

/** 列表表格列 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      fixed: 'left',
      slots: { content: 'expand_content' },
      type: 'expand',
      width: 48,
    },
    {
      field: 'no',
      fixed: 'left',
      slots: { default: 'no' },
      title: '单号',
      width: 210,
    },
    {
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.WMS_ORDER_STATUS },
      },
      field: 'status',
      fixed: 'left',
      title: '盘库状态',
      width: 110,
    },
    {
      field: 'warehouseName',
      minWidth: 180,
      title: '仓库',
    },
    {
      field: 'quantityAmount',
      minWidth: 200,
      slots: { default: 'quantityAmount' },
      title: '盈亏/金额(元)',
    },
    {
      field: 'operateInfo',
      minWidth: 280,
      slots: { default: 'operateInfo' },
      title: '操作信息',
    },
    {
      field: 'remark',
      minWidth: 160,
      title: '备注',
    },
    {
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 220,
    },
  ];
}

/** 详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'no',
      label: '盘库单号',
      render: (val) => val || '-',
    },
    {
      field: 'warehouseName',
      label: '仓库',
      render: (val) => val || '-',
    },
    {
      field: 'orderTime',
      label: '单据日期',
      render: (val) => formatDate(val, 'YYYY-MM-DD') || '-',
    },
    {
      field: 'status',
      label: '单据状态',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, {
              type: DICT_TYPE.WMS_ORDER_STATUS,
              value: val,
            }),
    },
    {
      field: 'totalQuantity',
      label: '盈亏数量',
      render: (val) =>
        h('span', { class: getLossClass(val) }, formatQuantity(val) || '-'),
    },
    {
      field: 'totalPrice',
      label: '总金额',
      render: (val) => formatPrice(val) || '-',
    },
    {
      field: 'actualPrice',
      label: '实际金额',
      render: (val) => formatPrice(val) || '-',
    },
    {
      field: 'differencePrice',
      label: '实际盈亏金额',
      render: (_val, data) => {
        const differencePrice = getOrderDifferencePrice(data || {});
        return h(
          'span',
          { class: getLossClass(differencePrice) },
          formatPrice(differencePrice) || '-',
        );
      },
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (val) => formatDateTime(val) || '-',
    },
    {
      field: 'creatorName',
      label: '创建人',
      render: (val, data) => val || data?.creator || '-',
    },
    {
      field: 'updateTime',
      label: '更新时间',
      render: (val) => formatDateTime(val) || '-',
    },
    {
      field: 'updaterName',
      label: '更新人',
      render: (val, data) => val || data?.updater || '-',
    },
    {
      field: 'remark',
      label: '备注',
      render: (val) => val || '-',
      span: 2,
    },
  ];
}

/** 表单的配置项 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'id',
    },
    {
      component: 'Input',
      componentProps: {
        maxLength: 64,
        placeholder: '请输入盘库单号',
      },
      fieldName: 'no',
      label: '盘库单号',
      rules: z.string().min(1, '盘库单号不能为空').max(64),
    },
    {
      component: markRaw(WmsWarehouseSelect),
      componentProps: {
        disabled: true,
      },
      fieldName: 'warehouseId',
      label: '仓库',
      rules: 'required',
    },
    {
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        format: 'YYYY-MM-DD',
        placeholder: '请选择单据日期',
        valueFormat: 'x',
      },
      fieldName: 'orderTime',
      label: '单据日期',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      fieldName: 'actualPrice',
      label: '实际金额',
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 255,
        placeholder: '请输入备注',
      },
      fieldName: 'remark',
      formItemClass: 'col-span-2',
      label: '备注',
    },
  ];
}

/** 选择盘库仓库表单的配置项 */
export function useWarehouseFormSchema(
  onWarehouseChange: (warehouse: unknown) => void,
): VbenFormSchema[] {
  return [
    {
      component: markRaw(WmsWarehouseSelect),
      componentProps: {
        onChange: onWarehouseChange,
      },
      fieldName: 'warehouseId',
      label: '仓库',
      rules: 'required',
    },
  ];
}

interface CheckOrderDetailFooterRow {
  actualPrice?: number;
  checkQuantity?: number;
  differencePrice?: number;
  differenceQuantity?: number;
  quantity?: number;
}
type CheckOrderDetailFooterColumn = Pick<
  NonNullable<NonNullable<VxeTableGridOptions['columns']>[number]>,
  'field'
>;

/** 明细表格的合计行 */
export function getCheckDetailFooter({
  columns,
  data,
}: {
  columns: CheckOrderDetailFooterColumn[];
  data: CheckOrderDetailFooterRow[];
}) {
  return [
    columns.map((column, index) => {
      if (index === 0) {
        return '合计';
      }
      if (column.field === 'quantity') {
        return formatSumQuantity(data, (detail) => detail.quantity);
      }
      if (column.field === 'checkQuantity') {
        return formatSumQuantity(data, (detail) => detail.checkQuantity);
      }
      if (column.field === 'actualPrice') {
        return formatSumPrice(data, (detail) => detail.actualPrice);
      }
      if (column.field === 'differenceQuantity') {
        return formatQuantity(
          sumQuantity(data, (detail) => detail.differenceQuantity),
        );
      }
      if (column.field === 'differencePrice') {
        return formatPrice(sumPrice(data, (detail) => detail.differencePrice));
      }
      return '';
    }),
  ];
}
