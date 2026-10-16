import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallSpuApi } from '#/api/mall/product/spu';

import { h } from 'vue';

import { handleTree, treeToString } from '@vben/utils';

import { Switch, Tag } from 'antdv-next';

import { getCategoryList } from '#/api/mall/product/category';
import { getRangePickerDefaultProps } from '#/utils';

/** 关联数据 */
let categoryList: any[] = [];

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
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
      component: 'ApiTreeSelect',
      componentProps: {
        placeholder: '请选择商品分类',
        allowClear: true,
        api: async () => {
          categoryList = handleTree(
            await getCategoryList({}),
            'id',
            'parentId',
            'children',
          );
          return categoryList;
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
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

/** 列表的字段 */
export function useGridColumns(
  onStatusChange?: (
    newStatus: number,
    row: MallSpuApi.Spu,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '商品编号',
      fixed: 'left',
      minWidth: 100,
    },
    {
      field: 'name',
      title: '商品名称',
      fixed: 'left',
      minWidth: 200,
    },
    {
      field: 'picUrl',
      title: '商品图片',
      minWidth: 100,
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'categoryId',
      title: '商品分类',
      minWidth: 150,
      formatter: ({ row }) => {
        return treeToString(categoryList, row.categoryId);
      },
    },
    {
      field: 'status',
      title: '销售状态',
      minWidth: 100,
      slots: {
        default: ({ row }) => {
          if (row.status < 0) {
            return h(Tag, {}, () => '回收站');
          }
          return h(Switch, {
            checkedValue: 1,
            unCheckedValue: 0,
            checkedChildren: '上架',
            unCheckedChildren: '下架',
            checked: row.status,
            loading: row.__loading_status ?? false,
            'onUpdate:checked': async (value: unknown) => {
              const status = Number(value);
              row.__loading_status = true;
              try {
                const result = await onStatusChange?.(status, row);
                if (result !== false) {
                  row.status = status;
                }
              } finally {
                row.__loading_status = false;
              }
            },
          });
        },
      },
    },
    {
      field: 'price',
      title: '价格(元)',
      minWidth: 100,
      formatter: 'formatFenToYuanAmount',
    },
    {
      field: 'marketPrice',
      title: '市场价(元)',
      minWidth: 100,
      formatter: 'formatFenToYuanAmount',
    },
    {
      field: 'costPrice',
      title: '成本价(元)',
      minWidth: 100,
      formatter: 'formatFenToYuanAmount',
    },
    {
      field: 'salesCount',
      title: '销量',
      minWidth: 80,
    },
    {
      field: 'virtualSalesCount',
      title: '虚拟销量',
      minWidth: 100,
    },
    {
      field: 'stock',
      title: '库存',
      minWidth: 80,
    },
    {
      field: 'browseCount',
      title: '浏览量',
      minWidth: 100,
    },
    {
      field: 'sort',
      title: '排序',
      minWidth: 80,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 300,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
