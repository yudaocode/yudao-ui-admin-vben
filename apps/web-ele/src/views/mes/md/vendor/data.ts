import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdVendorApi } from '#/api/mes/md/vendor';

import { h } from 'vue';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改供应商的表单 */
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
      label: '供应商编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入供应商编码',
      },
      rules: 'required',
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                ElButton,
                {
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.MD_VENDOR_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '自动生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '供应商名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入供应商名称',
      },
      rules: z.string().min(1, '供应商名称不能为空').max(100),
    },
    {
      fieldName: 'nickname',
      label: '供应商简称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入供应商简称',
      },
    },
    {
      fieldName: 'englishName',
      label: '英文名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入供应商英文名称',
      },
    },
    {
      fieldName: 'level',
      label: '供应商等级',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_VENDOR_LEVEL),
        placeholder: '请选择供应商等级',
      },
    },
    {
      fieldName: 'description',
      label: '供应商简介',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入供应商简介',
        rows: 2,
      },
    },
    {
      fieldName: 'address',
      label: '供应商地址',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入供应商地址',
        rows: 2,
      },
    },
    {
      fieldName: 'website',
      label: '官网地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入供应商官网地址',
      },
    },
    {
      fieldName: 'email',
      label: '邮箱地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入供应商邮箱地址',
      },
      rules: z.string().email('邮箱格式不正确').or(z.literal('')).optional(),
    },
    {
      fieldName: 'telephone',
      label: '供应商电话',
      component: 'Input',
      componentProps: {
        placeholder: '请输入供应商电话',
      },
    },
    {
      fieldName: 'score',
      label: '供应商评分',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        max: 100,
        min: 0,
        precision: 0,
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
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'logo',
      label: '供应商 LOGO',
      component: 'Input',
      componentProps: {
        placeholder: '请输入供应商 LOGO 地址',
      },
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

/** 导入供应商的表单 */
export function useImportFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'file',
      label: '供应商数据',
      component: 'Upload',
      rules: 'required',
      help: '仅允许导入 xls、xlsx 格式文件',
    },
    {
      fieldName: 'updateSupport',
      label: '是否覆盖',
      component: 'Switch',
      componentProps: {
        activeText: '是',
        inactiveText: '否',
        inlinePrompt: true,
      },
      rules: z.boolean().default(false),
      help: '是否更新已经存在的供应商数据',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '供应商编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入供应商编码',
      },
    },
    {
      fieldName: 'name',
      label: '供应商名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入供应商名称',
      },
    },
    {
      fieldName: 'nickname',
      label: '供应商简称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入供应商简称',
      },
    },
    {
      fieldName: 'englishName',
      label: '英文名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入英文名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesMdVendorApi.Vendor>['columns'] {
  return [
    {
      field: 'code',
      title: '供应商编码',
      minWidth: 150,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '供应商名称',
      minWidth: 180,
    },
    {
      field: 'nickname',
      title: '供应商简称',
      width: 120,
    },
    {
      field: 'level',
      title: '供应商等级',
      width: 130,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_VENDOR_LEVEL },
      },
    },
    {
      field: 'score',
      title: '供应商评分',
      width: 120,
    },
    {
      field: 'telephone',
      title: '供应商电话',
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
      field: 'remark',
      title: '备注',
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

/** 供应商选择弹窗的搜索表单 */
export function useVendorSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '供应商编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入供应商编码',
      },
    },
    {
      fieldName: 'name',
      label: '供应商名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入供应商名称',
      },
    },
    {
      fieldName: 'nickname',
      label: '供应商简称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入供应商简称',
      },
    },
    {
      fieldName: 'englishName',
      label: '英文名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入英文名称',
      },
    },
  ];
}

/** 供应商选择弹窗的字段 */
export function useVendorSelectGridColumns(
  multiple = true,
): VxeTableGridOptions<MesMdVendorApi.Vendor>['columns'] {
  return [
    { type: multiple ? 'checkbox' : 'radio', width: 50 },
    {
      field: 'code',
      title: '供应商编码',
      minWidth: 160,
    },
    {
      field: 'name',
      title: '供应商名称',
      minWidth: 170,
    },
    {
      field: 'nickname',
      title: '供应商简称',
      width: 120,
    },
    {
      field: 'level',
      title: '供应商等级',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_VENDOR_LEVEL },
      },
    },
    {
      field: 'score',
      title: '供应商评分',
      width: 110,
    },
    {
      field: 'telephone',
      title: '联系电话',
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
    {
      field: 'remark',
      title: '备注',
      minWidth: 140,
    },
  ];
}
