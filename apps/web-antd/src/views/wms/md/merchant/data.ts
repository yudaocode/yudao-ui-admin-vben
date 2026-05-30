import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { generateWmsCode, h } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';

/** 新增/修改往来企业的表单 */
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
      label: '往来企业编号',
      component: 'Input',
      componentProps: {
        maxLength: 20,
        placeholder: '请输入往来企业编号',
      },
      rules: z.string().min(1, '往来企业编号不能为空').max(20),
      suffix: () => {
        return h(
          Button,
          {
            type: 'default',
            onClick: () => {
              formApi?.setFieldValue('code', generateWmsCode('M'));
            },
          },
          { default: () => '生成' },
        );
      },
    },
    {
      fieldName: 'name',
      label: '往来企业名称',
      component: 'Input',
      componentProps: {
        maxLength: 60,
        placeholder: '请输入往来企业名称',
      },
      rules: z.string().min(1, '往来企业名称不能为空').max(60),
    },
    {
      fieldName: 'type',
      label: '往来企业类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.WMS_MERCHANT_TYPE, 'number'),
        placeholder: '请选择往来企业类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'level',
      label: '级别',
      component: 'Input',
      componentProps: {
        maxLength: 10,
        placeholder: '请输入级别',
      },
    },
    {
      fieldName: 'bankName',
      label: '开户行',
      component: 'Input',
      componentProps: {
        maxLength: 255,
        placeholder: '请输入开户行',
      },
    },
    {
      fieldName: 'bankAccount',
      label: '银行账户',
      component: 'Input',
      componentProps: {
        maxLength: 40,
        placeholder: '请输入银行账户',
      },
    },
    {
      fieldName: 'address',
      label: '地址',
      component: 'Input',
      componentProps: {
        maxLength: 200,
        placeholder: '请输入地址',
      },
    },
    {
      fieldName: 'contact',
      label: '联系人',
      component: 'Input',
      componentProps: {
        maxLength: 30,
        placeholder: '请输入联系人',
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
      componentProps: {
        maxLength: 13,
        placeholder: '请输入手机号',
      },
    },
    {
      fieldName: 'telephone',
      label: '座机号',
      component: 'Input',
      componentProps: {
        maxLength: 13,
        placeholder: '请输入座机号',
      },
    },
    {
      fieldName: 'email',
      label: 'Email',
      component: 'Input',
      componentProps: {
        maxLength: 50,
        placeholder: '请输入 Email',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      componentProps: {
        maxLength: 255,
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '往来企业编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入往来企业编号',
      },
    },
    {
      fieldName: 'name',
      label: '往来企业名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入往来企业名称',
      },
    },
    {
      fieldName: 'type',
      label: '往来企业类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.WMS_MERCHANT_TYPE, 'number'),
        placeholder: '请选择往来企业类型',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'code',
      title: '往来企业编号',
      width: 160,
    },
    {
      field: 'name',
      title: '往来企业名称',
      minWidth: 160,
    },
    {
      field: 'type',
      title: '往来企业类型',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.WMS_MERCHANT_TYPE },
      },
    },
    {
      field: 'level',
      title: '级别',
      width: 100,
      align: 'center',
    },
    {
      field: 'contact',
      title: '联系人',
      width: 120,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 160,
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
