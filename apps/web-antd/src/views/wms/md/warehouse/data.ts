import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { h } from 'vue';

import { generateWmsCode } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';

/** 新增/修改仓库的表单 */
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
      label: '仓库名称',
      component: 'Input',
      componentProps: {
        maxLength: 50,
        placeholder: '请输入仓库名称',
      },
      rules: z.string().min(1, '仓库名称不能为空').max(50),
    },
    {
      fieldName: 'code',
      label: '仓库编号',
      component: 'Input',
      componentProps: {
        maxLength: 20,
        placeholder: '请输入仓库编号',
      },
      rules: z.string().min(1, '仓库编号不能为空').max(20),
      suffix: () => {
        return h(
          Button,
          {
            type: 'default',
            onClick: () => {
              formApi?.setFieldValue('code', generateWmsCode('W'));
            },
          },
          { default: () => '生成' },
        );
      },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
      },
      rules: z.number().default(0),
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
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '仓库名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入仓库名称',
      },
    },
    {
      fieldName: 'code',
      label: '仓库编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入仓库编号',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '仓库名称',
      minWidth: 160,
    },
    {
      field: 'code',
      title: '仓库编号',
      minWidth: 140,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 220,
    },
    {
      field: 'sort',
      title: '排序',
      width: 100,
      align: 'center',
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
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
