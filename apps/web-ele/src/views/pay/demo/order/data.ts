import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Select',
      fieldName: 'spuId',
      label: '商品',
      rules: 'required',
      componentProps: {
        options: [
          { label: '华为手机 --- 1.00元', value: 1, price: 1 },
          { label: '小米电视 --- 10.00元', value: 2, price: 10 },
          { label: '苹果手表 --- 100.00元', value: 3, price: 100 },
          { label: '华硕笔记本 --- 1000.00元', value: 4, price: 1000 },
          { label: '蔚来汽车 --- 200000.00元', value: 5, price: 200_000 },
        ],
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '订单编号',
    },
    {
      field: 'userId',
      title: '用户编号',
    },
    {
      field: 'spuName',
      title: '商品名字',
    },
    {
      field: 'price',
      title: '支付价格',
      formatter: 'formatFenToYuanAmount',
    },
    {
      field: 'refundPrice',
      title: '退款金额',
      formatter: 'formatFenToYuanAmount',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'payOrderId',
      title: '支付单号',
    },
    {
      field: 'payStatus',
      title: '是否支付',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'payTime',
      title: '支付时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'refundTime',
      title: '退款时间',
      slots: { default: 'refundTime' },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
