import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'spuName',
      label: '商品名称',
      component: 'Input',
    },
    {
      fieldName: 'no',
      label: '退款编号',
      component: 'Input',
    },
    {
      fieldName: 'orderNo',
      label: '订单编号',
      component: 'Input',
    },
    {
      fieldName: 'status',
      label: '售后状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.TRADE_AFTER_SALE_STATUS, 'number'),
      },
    },
    {
      fieldName: 'status',
      label: '售后方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.TRADE_AFTER_SALE_WAY, 'number'),
      },
    },
    {
      fieldName: 'type',
      label: '售后类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.TRADE_AFTER_SALE_TYPE, 'number'),
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeGridPropTypes.Columns {
  return [
    {
      field: 'no',
      title: '退款编号',
      fixed: 'left',
    },
    {
      field: 'orderNo',
      title: '订单编号',
      fixed: 'left',
      slots: { default: 'orderNo' },
    },
    {
      field: 'spuName',
      title: '商品名称',
      align: 'left',
      minWidth: 200,
    },
    {
      field: 'picUrl',
      title: '商品图片',
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'properties',
      title: '商品属性',
      minWidth: 200,
      formatter: ({ cellValue }) => {
        return cellValue && cellValue.length > 0
          ? cellValue
              .map((item: any) => `${item.propertyName} : ${item.valueName}`)
              .join('\n')
          : '-';
      },
    },
    {
      field: 'refundPrice',
      title: '订单金额',
      formatter: 'formatFenToYuanAmount',
    },
    {
      field: 'user.nickname',
      title: '买家',
    },
    {
      field: 'createTime',
      title: '申请时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'content',
      title: '售后状态',
      cellRender: {
        name: 'CellDictTag',
        props: {
          dictType: DICT_TYPE.TRADE_AFTER_SALE_STATUS,
        },
      },
    },
    {
      field: 'way',
      title: '售后方式',
      cellRender: {
        name: 'CellDictTag',
        props: {
          dictType: DICT_TYPE.TRADE_AFTER_SALE_WAY,
        },
      },
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
