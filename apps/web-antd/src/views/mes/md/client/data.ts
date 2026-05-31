import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdClientApi } from '#/api/mes/md/client';

import { h } from 'vue';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改客户的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
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
      fieldName: 'code',
      label: '客户编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户编码',
      },
      rules: 'required',
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                Button,
                {
                  type: 'default',
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.MD_CLIENT_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '自动生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '客户名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户名称',
      },
      rules: z.string().min(1, '客户名称不能为空').max(100),
    },
    {
      fieldName: 'nickname',
      label: '客户简称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户简称',
      },
    },
    {
      fieldName: 'englishName',
      label: '客户英文名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户英文名称',
      },
    },
    {
      fieldName: 'type',
      label: '客户类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_CLIENT_TYPE, 'number'),
        placeholder: '请选择客户类型',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'description',
      label: '客户简介',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入客户简介',
        rows: 2,
      },
    },
    {
      fieldName: 'address',
      label: '客户地址',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入客户地址',
        rows: 2,
      },
    },
    {
      fieldName: 'website',
      label: '客户官网地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户官网地址',
      },
    },
    {
      fieldName: 'email',
      label: '客户邮箱地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户邮箱地址',
      },
      rules: z.string().email('邮箱格式不正确').or(z.literal('')).optional(),
    },
    {
      fieldName: 'telephone',
      label: '客户电话',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户电话',
      },
    },
    {
      fieldName: 'logo',
      label: '客户 LOGO',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户 LOGO 地址',
      },
    },
    {
      fieldName: 'contact1Name',
      label: '联系人1',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系人1',
      },
    },
    {
      fieldName: 'contact1Telephone',
      label: '联系人1电话',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系人1电话',
      },
    },
    {
      fieldName: 'contact1Email',
      label: '联系人1邮箱',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系人1邮箱',
      },
      rules: z.string().email('邮箱格式不正确').or(z.literal('')).optional(),
    },
    {
      fieldName: 'contact2Name',
      label: '联系人2',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系人2',
      },
    },
    {
      fieldName: 'contact2Telephone',
      label: '联系人2电话',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系人2电话',
      },
    },
    {
      fieldName: 'contact2Email',
      label: '联系人2邮箱',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系人2邮箱',
      },
      rules: z.string().email('邮箱格式不正确').or(z.literal('')).optional(),
    },
    {
      fieldName: 'creditCode',
      label: '社会信用代码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入统一社会信用代码',
      },
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
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 导入客户的表单 */
export function useImportFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'file',
      label: '客户数据',
      component: 'Upload',
      rules: 'required',
      help: '仅允许导入 xls、xlsx 格式文件',
    },
    {
      fieldName: 'updateSupport',
      label: '是否覆盖',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(false),
      help: '是否更新已经存在的客户数据',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '客户编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入客户编码',
      },
    },
    {
      fieldName: 'name',
      label: '客户名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入客户名称',
      },
    },
    {
      fieldName: 'nickname',
      label: '客户简称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入客户简称',
      },
    },
    {
      fieldName: 'englishName',
      label: '英文名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入客户英文名称',
      },
    },
    {
      fieldName: 'type',
      label: '客户类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_CLIENT_TYPE, 'number'),
        placeholder: '请选择客户类型',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesMdClientApi.Client>['columns'] {
  return [
    {
      field: 'code',
      title: '客户编码',
      minWidth: 150,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '客户名称',
      minWidth: 160,
    },
    {
      field: 'nickname',
      title: '客户简称',
      minWidth: 130,
    },
    {
      field: 'type',
      title: '客户类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_CLIENT_TYPE },
      },
    },
    {
      field: 'telephone',
      title: '客户电话',
      minWidth: 140,
    },
    {
      field: 'contact1Name',
      title: '联系人1',
      width: 120,
    },
    {
      field: 'contact1Telephone',
      title: '联系人1电话',
      minWidth: 140,
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
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
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 客户选择弹窗的搜索表单 */
export function useClientSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '客户编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入客户编码',
      },
    },
    {
      fieldName: 'name',
      label: '客户名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入客户名称',
      },
    },
    {
      fieldName: 'nickname',
      label: '客户简称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入客户简称',
      },
    },
    {
      fieldName: 'englishName',
      label: '英文名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入客户英文名称',
      },
    },
  ];
}

/** 客户选择弹窗的字段 */
export function useClientSelectGridColumns(
  multiple = true,
): VxeTableGridOptions<MesMdClientApi.Client>['columns'] {
  return [
    { type: multiple ? 'checkbox' : 'radio', width: 50 },
    {
      field: 'code',
      title: '客户编码',
      minWidth: 160,
    },
    {
      field: 'name',
      title: '客户名称',
      minWidth: 160,
    },
    {
      field: 'nickname',
      title: '客户简称',
      width: 120,
    },
    {
      field: 'type',
      title: '客户类型',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_CLIENT_TYPE },
      },
    },
    {
      field: 'contact1Name',
      title: '联系人',
      width: 120,
    },
    {
      field: 'telephone',
      title: '联系电话',
      width: 140,
    },
    {
      field: 'contact1Telephone',
      title: '联系人电话',
      width: 140,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
  ];
}
