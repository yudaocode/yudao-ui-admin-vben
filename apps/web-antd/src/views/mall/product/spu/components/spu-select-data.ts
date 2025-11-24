import type { Ref } from 'vue';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallCategoryApi } from '#/api/mall/product/category';

import { computed } from 'vue';

import { formatToFraction } from '@vben/utils';

import { getRangePickerDefaultProps } from '#/utils';

/**
 * @description: 列表的搜索表单
 */
export function useGridFormSchema(
  categoryTreeList: Ref<MallCategoryApi.Category[]>,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '商品名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入商品名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'categoryId',
      label: '商品分类',
      component: 'TreeSelect',
      componentProps: {
        treeData: computed(() => categoryTreeList.value),
        fieldNames: {
          label: 'name',
          value: 'id',
        },
        treeCheckStrictly: true,
        placeholder: '请选择商品分类',
        allowClear: true,
        showSearch: true,
        treeNodeFilterProp: 'name',
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

/**
 * @description: 列表的字段
 */
export function useGridColumns(
  isSelectSku: boolean,
): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'expand',
      width: 30,
      visible: isSelectSku,
      slots: { content: 'expand_content' },
    },
    { type: 'checkbox', width: 55 },
    {
      field: 'id',
      title: '商品编号',
      minWidth: 100,
      align: 'center',
    },
    {
      field: 'picUrl',
      title: '商品图',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'name',
      title: '商品名称',
      minWidth: 300,
      showOverflow: 'tooltip',
    },
    {
      field: 'price',
      title: '商品售价',
      minWidth: 90,
      align: 'center',
      formatter: ({ cellValue }) => {
        // 格式化价格显示（价格以分为单位存储）
        return formatToFraction(cellValue);
      },
    },
    {
      field: 'salesCount',
      title: '销量',
      minWidth: 90,
      align: 'center',
    },
    {
      field: 'stock',
      title: '库存',
      minWidth: 90,
      align: 'center',
    },
    {
      field: 'sort',
      title: '排序',
      minWidth: 70,
      align: 'center',
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
  ] as VxeTableGridOptions['columns'];
}
