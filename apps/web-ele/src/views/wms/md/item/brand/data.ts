import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { h } from 'vue';

import { generateWmsCode } from '@vben/constants';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';

/** 新增/修改商品品牌的表单 */
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
      fieldName: 'code',
      label: '品牌编号',
      component: 'Input',
      componentProps: {
        maxLength: 20,
        placeholder: '请输入品牌编号',
      },
      rules: z.string().min(1, '品牌编号不能为空').max(20),
      suffix: () => {
        return h(
          ElButton,
          {
            type: 'default',
            onClick: () => {
              formApi?.setFieldValue('code', generateWmsCode('B'));
            },
          },
          { default: () => '生成' },
        );
      },
    },
    {
      fieldName: 'name',
      label: '品牌名称',
      component: 'Input',
      componentProps: {
        maxLength: 30,
        placeholder: '请输入品牌名称',
      },
      rules: z.string().min(1, '品牌名称不能为空').max(30),
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '品牌编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入品牌编号',
      },
    },
    {
      fieldName: 'name',
      label: '品牌名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入品牌名称',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'code',
      title: '品牌编号',
      width: 160,
    },
    {
      field: 'name',
      title: '品牌名称',
      minWidth: 160,
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
