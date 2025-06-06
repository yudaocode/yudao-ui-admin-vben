import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getProductCategoryList } from '#/api/crm/product/category';
import { DictTag } from '#/components/dict-tag';
import {
  CommonStatusEnum,
  DICT_TYPE,
  erpPriceInputFormatter,
  getDictOptions,
} from '#/utils';

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
      component: 'Input',
      fieldName: 'name',
      label: '产品名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'no',
      label: '产品编码',
      rules: 'required',
    },
    {
      component: 'ApiTreeSelect',
      fieldName: 'categoryName',
      label: '产品类型',
      rules: 'required',
      componentProps: {
        api: async () => {
          const data = await getProductCategoryList();
          return handleTree(data);
        },
        fieldNames: { label: 'name', value: 'id', children: 'children' },
      },
    },
    {
      fieldName: 'unit',
      label: '产品单位',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_PRODUCT_UNIT, 'number'),
      },
      rules: 'required',
    },
    {
      component: 'InputNumber',
      fieldName: 'price',
      label: '价格（元）',
      rules: 'required',
      componentProps: {
        min: 0,
        precision: 2,
        step: 0.1,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      label: '产品描述',
    },
    {
      fieldName: 'status',
      label: '上架状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_PRODUCT_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '产品名称',
      component: 'Input',
    },
    {
      fieldName: 'status',
      label: '上架状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.CRM_PRODUCT_STATUS, 'number'),
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '产品编号',
      visible: false,
    },
    {
      field: 'name',
      title: '产品名称',
      slots: { default: 'name' },
    },
    {
      field: 'categoryName',
      title: '产品类型',
    },
    {
      field: 'unit',
      title: '产品单位',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_PRODUCT_UNIT },
      },
    },
    {
      field: 'no',
      title: '产品编码',
    },
    {
      field: 'price',
      title: '价格（元）',
      formatter: 'formatNumber',
    },
    {
      field: 'description',
      title: '产品描述',
    },
    {
      field: 'status',
      title: '上架状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_PRODUCT_STATUS },
      },
    },
    {
      field: 'ownerUserName',
      title: '负责人',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'creatorName',
      title: '创建人',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

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
      formatter: 'formatNumber',
    },
    {
      field: 'businessPrice',
      title: '商机价格（元）',
      formatter: 'formatNumber',
      visible: showBussinePrice,
    },
    {
      field: 'count',
      title: '数量',
      formatter: 'formatNumber',
    },
    {
      field: 'totalPrice',
      title: '合计金额（元）',
      formatter: 'formatNumber',
    },
  ];
}
