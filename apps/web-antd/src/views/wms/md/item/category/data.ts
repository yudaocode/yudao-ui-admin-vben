import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsItemCategoryApi } from '#/api/wms/md/item/category';

import { DICT_TYPE, generateWmsCode, h } from 'vue';

import { CommonStatusEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { getItemCategorySimpleList } from '#/api/wms/md/item/category';

/** 新增/修改商品分类的表单 */
export function useFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'parentId',
      label: '上级分类',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const data = await getItemCategorySimpleList();
          return [
            {
              id: 0,
              name: '顶级分类',
              children: handleTree(data),
            },
          ];
        },
        childrenField: 'children',
        labelField: 'name',
        placeholder: '请选择上级分类',
        treeDefaultExpandAll: true,
        treeNodeFilterProp: 'name',
        valueField: 'id',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'code',
      label: '分类编号',
      component: 'Input',
      componentProps: {
        maxLength: 20,
        placeholder: '请输入分类编号',
      },
      rules: z.string().min(1, '分类编号不能为空').max(20),
      suffix: () => {
        return h(
          Button,
          {
            type: 'default',
            onClick: () => {
              formApi?.setFieldValue('code', generateWmsCode('C'));
            },
          },
          { default: () => '生成' },
        );
      },
    },
    {
      fieldName: 'name',
      label: '分类名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入分类名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'sort',
      label: '显示排序',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '分类编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入分类编号',
      },
    },
    {
      fieldName: 'name',
      label: '分类名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入分类名称',
      },
    },
    {
      fieldName: 'status',
      label: '分类状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择分类状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<WmsItemCategoryApi.ItemCategory>['columns'] {
  return [
    {
      field: 'name',
      title: '分类名称',
      minWidth: 200,
      align: 'left',
      treeNode: true,
    },
    {
      field: 'code',
      title: '分类编号',
      width: 160,
      align: 'center',
    },
    {
      field: 'sort',
      title: '排序',
      width: 120,
      align: 'center',
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
