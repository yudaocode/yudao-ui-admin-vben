import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { useUserStore } from '@vben/stores';
import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getProductCategoryList } from '#/api/crm/product/category';
import { getSimpleUserList } from '#/api/system/user';
import { CommonStatusEnum, DICT_TYPE, getDictOptions } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  const userStore = useUserStore();
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
      component: 'ApiSelect',
      fieldName: 'ownerUserId',
      label: '负责人',
      rules: 'required',
      componentProps: {
        api: () => getSimpleUserList(),
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
      },
      defaultValue: userStore.userInfo?.id,
    },
    {
      component: 'Input',
      fieldName: 'no',
      label: '产品编码',
      rules: 'required',
    },
    {
      component: 'ApiTreeSelect',
      fieldName: 'categoryId',
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
      minWidth: 240,
      slots: { default: 'name' },
    },
    {
      field: 'categoryName',
      title: '产品类型',
      minWidth: 120,
    },
    {
      field: 'unit',
      title: '产品单位',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_PRODUCT_UNIT },
      },
    },
    {
      field: 'no',
      title: '产品编码',
      minWidth: 120,
    },
    {
      field: 'price',
      title: '价格（元）',
      formatter: 'formatAmount2',
      minWidth: 120,
    },
    {
      field: 'description',
      title: '产品描述',
      minWidth: 200,
    },
    {
      field: 'status',
      title: '上架状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_PRODUCT_STATUS },
      },
      minWidth: 120,
    },
    {
      field: 'ownerUserName',
      title: '负责人',
      minWidth: 120,
    },
    {
      field: 'updateTime',
      title: '更新时间',
      formatter: 'formatDateTime',
      minWidth: 180,
    },
    {
      field: 'creatorName',
      title: '创建人',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
      minWidth: 180,
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 代码生成表格列定义 */
export function useProductEditTableColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', minWidth: 50 },
    {
      field: 'productId',
      title: '产品名称',
      minWidth: 100,
      slots: { default: 'productId' },
    },
    {
      field: 'productNo',
      title: '条码',
      minWidth: 150,
    },
    {
      field: 'productUnit',
      title: '单位',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_PRODUCT_UNIT },
      },
    },
    {
      field: 'productPrice',
      title: '价格（元）',
      minWidth: 100,
      formatter: 'formatAmount2',
    },
    {
      field: 'sellingPrice',
      title: '售价（元）',
      minWidth: 100,
      slots: { default: 'sellingPrice' },
    },
    {
      field: 'count',
      title: '数量',
      minWidth: 100,
      slots: { default: 'count' },
    },
    {
      field: 'totalPrice',
      title: '合计',
      minWidth: 100,
      formatter: 'formatAmount2',
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
