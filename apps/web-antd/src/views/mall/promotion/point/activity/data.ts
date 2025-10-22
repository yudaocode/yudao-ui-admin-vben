// 1. 导入类型
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

// 2. 导入 VBEN 常量和工具
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

// 3. 导入 Zod 用于高级验证
import { z } from '#/adapter/form';

/**
 * @description: 列表的搜索表单
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'status',
      label: '活动状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择活动状态',
        allowClear: true,
      },
    },
  ];
}

/**
 * @description: 列表的字段
 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '活动编号',
      minWidth: 80,
    },
    {
      field: 'picUrl',
      title: '商品图片',
      minWidth: 80,
      cellRender: {
        name: 'CellImage',
        props: {
          height: 40,
        },
      },
    },
    {
      field: 'spuName',
      title: '商品标题',
      minWidth: 300,
    },
    {
      field: 'marketPrice',
      title: '原价',
      minWidth: 100,
      formatter: 'formatAmount2',
    },
    {
      field: 'status',
      title: '活动状态',
      minWidth: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: {
          type: DICT_TYPE.COMMON_STATUS,
          value: CommonStatusEnum.ENABLE,
        },
      },
    },
    {
      field: 'stock',
      title: '库存',
      minWidth: 80,
      align: 'center',
    },
    {
      field: 'totalStock',
      title: '总库存',
      minWidth: 80,
      align: 'center',
    },
    {
      field: 'redeemedQuantity',
      title: '已兑换数量',
      minWidth: 100,
      align: 'center',
      // 使用 formatter 计算已兑换数量
      formatter: ({ row }) => {
        return (row.totalStock || 0) - (row.stock || 0);
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/**
 * @description: 新增/修改的表单
 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    // 隐藏的 ID 字段
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'spuId',
      label: '积分商城活动商品',
      component: 'Input',
      rules: 'required',
      formItemClass: 'col-span-2',
      // 通过插槽实现自定义商品选择器
      renderComponentContent: () => ({
        default: () => null,
      }),
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        rows: 4,
      },
      formItemClass: 'col-span-2',
    },
  ];
}
