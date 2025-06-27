import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { erpPriceInputFormatter } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

/** 详情页的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'categoryName',
      label: '产品类别',
    },
    {
      field: 'unit',
      label: '产品单位',
      content: (data) =>
        h(DictTag, { type: DICT_TYPE.CRM_PRODUCT_UNIT, value: data?.unit }),
    },
    {
      field: 'price',
      label: '产品价格',
      content: (data) => erpPriceInputFormatter(data.price),
    },
    {
      field: 'no',
      label: '产品编码',
    },
  ];
}

/** 详情页的基础字段 */
export function useDetailBaseSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'name',
      label: '产品名称',
    },
    {
      field: 'no',
      label: '产品编码',
    },
    {
      field: 'price',
      label: '价格（元）',
      content: (data) => erpPriceInputFormatter(data.price),
    },
    {
      field: 'description',
      label: '产品描述',
    },
    {
      field: 'categoryName',
      label: '产品类型',
    },
    {
      field: 'status',
      label: '是否上下架',
      content: (data) =>
        h(DictTag, { type: DICT_TYPE.CRM_PRODUCT_STATUS, value: data?.status }),
    },
    {
      field: 'unit',
      label: '产品单位',
      content: (data) =>
        h(DictTag, { type: DICT_TYPE.CRM_PRODUCT_UNIT, value: data?.unit }),
    },
  ];
}

/** 详情列表的字段 */
export function useDetailListColumns(
  showBussinePrice: boolean,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'productName',
      title: '产品名称',
    },
    {
      field: 'productNo',
      title: '产品条码',
    },
    {
      field: 'productUnit',
      title: '产品单位',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_PRODUCT_UNIT },
      },
    },
    {
      field: 'productPrice',
      title: '产品价格（元）',
      formatter: 'formatAmount2',
    },
    {
      field: 'businessPrice',
      title: '商机价格（元）',
      formatter: 'formatAmount2',
      visible: showBussinePrice,
    },
    {
      field: 'contractPrice',
      title: '合同价格（元）',
      formatter: 'formatAmount2',
      visible: !showBussinePrice,
    },
    {
      field: 'count',
      title: '数量',
      formatter: 'formatNumber',
    },
    {
      field: 'totalPrice',
      title: '合计金额（元）',
      formatter: 'formatAmount2',
    },
  ];
}
