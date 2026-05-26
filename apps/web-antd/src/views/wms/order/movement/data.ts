import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsWarehouseApi } from '#/api/wms/md/warehouse';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, formatDateTime } from '@vben/utils';

import { z } from '#/adapter/form';
import { getSimpleUserList } from '#/api/system/user';
import { DictTag } from '#/components/dict-tag';
import { buildNumberRangeSchema } from '#/components/number-range-input';
import { getRangePickerDefaultProps } from '#/utils';
import { WmsWarehouseSelect } from '#/views/wms/md/warehouse/components';
import {
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  PRICE_PRECISION,
  QUANTITY_PRECISION,
} from '#/views/wms/utils/format';

/** 表单类型 */
export type FormType = 'create' | 'update';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入移库单号',
      },
      fieldName: 'no',
      label: '移库单号',
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
      fieldName: 'sourceWarehouseId',
      label: '来源仓库',
    },
    {
      component: markRaw(WmsWarehouseSelect),
      fieldName: 'targetWarehouseId',
      label: '目标仓库',
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
    buildNumberRangeSchema(
      '数量',
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
      title: '移库状态',
      width: 110,
    },
    {
      field: 'sourceWarehouseName',
      minWidth: 180,
      title: '来源仓库',
    },
    {
      field: 'targetWarehouseName',
      minWidth: 180,
      title: '目标仓库',
    },
    {
      field: 'quantityAmount',
      minWidth: 180,
      slots: { default: 'quantityAmount' },
      title: '总数量/总金额(元)',
    },
    {
      field: 'operateInfo',
      minWidth: 260,
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
      label: '移库单号',
      render: (val) => val || '-',
    },
    {
      field: 'sourceWarehouseName',
      label: '来源仓库',
      render: (val) => val || '-',
    },
    {
      field: 'targetWarehouseName',
      label: '目标仓库',
      render: (val) => val || '-',
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
      field: 'orderTime',
      label: '单据日期',
      render: (val) => formatDate(val, 'YYYY-MM-DD') || '-',
    },
    {
      field: 'totalQuantity',
      label: '总数量',
      render: (val) => formatQuantity(val) || '-',
    },
    {
      field: 'totalPrice',
      label: '总金额',
      render: (val) => formatPrice(val) || '-',
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

interface MovementFormSchemaOptions {
  onSourceWarehouseChange: (warehouse?: WmsWarehouseApi.Warehouse) => void;
  onTargetWarehouseChange: (warehouse?: WmsWarehouseApi.Warehouse) => void;
}

/** 表单的配置项 */
export function useFormSchema({
  onSourceWarehouseChange,
  onTargetWarehouseChange,
}: MovementFormSchemaOptions): VbenFormSchema[] {
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
        placeholder: '请输入移库单号',
      },
      fieldName: 'no',
      label: '移库单号',
      rules: z.string().min(1, '移库单号不能为空').max(64),
    },
    {
      component: markRaw(WmsWarehouseSelect),
      componentProps: {
        onChange: onSourceWarehouseChange,
      },
      fieldName: 'sourceWarehouseId',
      label: '来源仓库',
      rules: 'required',
    },
    {
      component: markRaw(WmsWarehouseSelect),
      componentProps: {
        onChange: onTargetWarehouseChange,
      },
      fieldName: 'targetWarehouseId',
      label: '目标仓库',
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

interface MovementOrderDetailFooterRow {
  quantity?: number;
  totalPrice?: number;
}
type MovementOrderDetailFooterColumn = Pick<
  NonNullable<NonNullable<VxeTableGridOptions['columns']>[number]>,
  'field'
>;

/** 明细表格的合计行 */
export function getDetailFooter({
  columns,
  data,
}: {
  columns: MovementOrderDetailFooterColumn[];
  data: MovementOrderDetailFooterRow[];
}) {
  return [
    columns.map((column, index) => {
      if (index === 0) {
        return '合计';
      }
      if (column.field === 'quantity') {
        return formatSumQuantity(data, (detail) => detail.quantity);
      }
      if (column.field === 'totalPrice') {
        return formatSumPrice(data, (detail) => detail.totalPrice);
      }
      return '';
    }),
  ];
}
