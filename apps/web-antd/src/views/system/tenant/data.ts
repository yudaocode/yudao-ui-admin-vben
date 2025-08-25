import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';
import { getTenantPackageList } from '#/api/system/tenant-package';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
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
      fieldName: 'name',
      label: '租户名称',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'packageId',
      label: '租户套餐',
      component: 'ApiSelect',
      componentProps: {
        api: () => getTenantPackageList(),
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择租户套餐',
      },
      rules: 'required',
    },
    {
      fieldName: 'contactName',
      label: '联系人',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'contactMobile',
      label: '联系手机',
      component: 'Input',
      rules: 'mobile',
    },
    {
      label: '用户名称',
      fieldName: 'username',
      component: 'Input',
      rules: 'required',
      dependencies: {
        triggerFields: ['id'],
        show: (values) => !values.id,
      },
    },
    {
      label: '用户密码',
      fieldName: 'password',
      component: 'InputPassword',
      rules: 'required',
      dependencies: {
        triggerFields: ['id'],
        show: (values) => !values.id,
      },
    },
    {
      label: '账号额度',
      fieldName: 'accountCount',
      component: 'InputNumber',
      rules: 'required',
    },
    {
      label: '过期时间',
      fieldName: 'expireTime',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
        placeholder: '请选择过期时间',
      },
      rules: 'required',
    },
    {
      label: '绑定域名',
      fieldName: 'websites',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入绑定域名，多个域名请换行分隔',
        rows: 3,
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '租户状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '租户名',
      component: 'Input',
      componentProps: {
        allowClear: true,
      },
    },
    {
      fieldName: 'contactName',
      label: '联系人',
      component: 'Input',
      componentProps: {
        allowClear: true,
      },
    },
    {
      fieldName: 'contactMobile',
      label: '联系手机',
      component: 'Input',
      componentProps: {
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
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
  getPackageName?: (packageId: number) => string | undefined,
): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '租户编号',
    },
    {
      field: 'name',
      title: '租户名',
    },
    {
      field: 'packageId',
      title: '租户套餐',
      formatter: (row: { cellValue: number }) => {
        return getPackageName?.(row.cellValue) || '-';
      },
    },
    {
      field: 'contactName',
      title: '联系人',
    },
    {
      field: 'contactMobile',
      title: '联系手机',
    },
    {
      field: 'accountCount',
      title: '账号额度',
    },
    {
      field: 'expireTime',
      title: '过期时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'websites',
      title: '绑定域名',
    },
    {
      field: 'status',
      title: '租户状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
