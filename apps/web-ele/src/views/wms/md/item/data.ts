import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { h, markRaw } from 'vue';

import { generateWmsCode } from '@vben/constants';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { getItemBrandSimpleList } from '#/api/wms/md/item/brand';

import { WmsItemBrandSelect } from './brand/components';
import { WmsItemCategorySelect } from './category/components';

/** 新增/修改商品的表单 */
export function useFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
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
      fieldName: 'name',
      label: '商品名称',
      component: 'Input',
      componentProps: {
        maxLength: 60,
        placeholder: '请输入商品名称',
      },
      rules: z.string().min(1, '商品名称不能为空').max(60),
    },
    {
      fieldName: 'categoryId',
      label: '商品分类',
      component: markRaw(WmsItemCategorySelect),
      rules: 'required',
    },
    {
      fieldName: 'code',
      label: '商品编号',
      component: 'Input',
      componentProps: {
        maxLength: 20,
        placeholder: '请输入商品编号',
      },
      rules: z.string().min(1, '商品编号不能为空').max(20),
      suffix: () => {
        return h(
          ElButton,
          {
            type: 'default',
            onClick: () => {
              formApi?.setFieldValue('code', generateWmsCode('I'));
            },
          },
          { default: () => '生成' },
        );
      },
    },
    {
      fieldName: 'unit',
      label: '商品单位',
      component: 'Input',
      componentProps: {
        maxLength: 20,
        placeholder: '请输入单位',
      },
    },
    {
      fieldName: 'brandId',
      label: '商品品牌',
      component: markRaw(WmsItemBrandSelect),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        maxLength: 255,
        placeholder: '请输入备注',
        rows: 3,
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '商品编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入商品编号',
      },
    },
    {
      fieldName: 'name',
      label: '商品名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入商品名称',
      },
    },
    {
      fieldName: 'brandId',
      label: '商品品牌',
      component: 'ApiSelect',
      componentProps: {
        api: getItemBrandSimpleList,
        clearable: true,
        filterable: true,
        labelField: 'name',
        placeholder: '请选择商品品牌',
        valueField: 'id',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'itemInfo',
      title: '商品信息',
      minWidth: 220,
      slots: { default: 'itemInfo' },
    },
    {
      field: 'skuInfo',
      title: '规格信息',
      minWidth: 180,
      slots: { default: 'skuInfo' },
    },
    {
      field: 'priceInfo',
      title: '金额(元)',
      minWidth: 140,
      slots: { default: 'priceInfo' },
    },
    {
      field: 'weightInfo',
      title: '重量(kg)',
      minWidth: 140,
      slots: { default: 'weightInfo' },
    },
    {
      field: 'dimensionInfo',
      title: '长宽高(cm)',
      minWidth: 180,
      align: 'right',
      slots: { default: 'dimensionInfo' },
    },
    {
      field: 'actions',
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** SKU 选择弹窗搜索表单 */
export function useSkuSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemName',
      label: '商品名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入商品名称',
      },
    },
    {
      fieldName: 'itemCode',
      label: '商品编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入商品编号',
      },
    },
    {
      fieldName: 'name',
      label: '规格名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入规格名称',
      },
    },
    {
      fieldName: 'code',
      label: '规格编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入规格编号',
      },
    },
    {
      fieldName: 'barCode',
      label: '条码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入条码',
      },
    },
  ];
}

/** SKU 选择弹窗列表字段 */
export function useSkuSelectGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 50 },
    {
      field: 'itemInfo',
      title: '商品信息',
      minWidth: 220,
      slots: { default: 'itemInfo' },
    },
    {
      field: 'skuInfo',
      title: '规格信息',
      minWidth: 220,
      slots: { default: 'skuInfo' },
    },
    {
      field: 'priceInfo',
      title: '金额(元)',
      minWidth: 160,
      slots: { default: 'priceInfo' },
    },
    {
      field: 'weightInfo',
      title: '重量(kg)',
      minWidth: 160,
      slots: { default: 'weightInfo' },
    },
    {
      field: 'dimensionInfo',
      title: '长宽高(cm)',
      minWidth: 180,
      align: 'right',
      slots: { default: 'dimensionInfo' },
    },
  ];
}
