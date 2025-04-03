import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemTenantApi } from '#/api/system/tenant';

import { z } from '#/adapter/form';
import { getTenantPackageList } from '#/api/system/tenantPackage';
import { CommonStatusEnum } from '#/utils/constants';
import { DICT_TYPE, getDictOptions } from '#/utils/dict';

/** 新增、修改表单 */
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
      component: 'Input',
      fieldName: 'name',
      label: '租户名称',
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      fieldName: 'packageId',
      label: '租户套餐',
      rules: 'required',
      componentProps: {
        api: () => getTenantPackageList(),
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择租户套餐',
      },
    },
    {
      component: 'Input',
      fieldName: 'contactName',
      label: '联系人',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'contactMobile',
      label: '联系手机',
    },
    {
      component: 'Input',
      label: '用户名称',
      fieldName: 'username',
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
      component: 'InputNumber',
      label: '账号额度',
      fieldName: 'accountCount',
      rules: 'required',
      defaultValue: 0,
      componentProps: {
        class: 'w-full',
      },
    },
    {
      component: 'DatePicker',
      label: '过期时间',
      fieldName: 'expireTime',
      rules: 'required',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      component: 'Input',
      label: '绑定域名',
      fieldName: 'website',
      rules: 'required',
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
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = SystemTenantApi.SystemTenant>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '租户编号',
      minWidth: 200,
    },
    {
      field: 'name',
      title: '租户名',
      minWidth: 200,
    },
    {
      field: 'packageId',
      title: '租户套餐',
      minWidth: 200,
    },
    {
      field: 'contactName',
      title: '联系人',
      minWidth: 100,
    },
    {
      field: 'contactMobile',
      title: '联系手机',
      minWidth: 200,
    },
    {
      field: 'accountCount',
      title: '账号额度',
      minWidth: 100,
    },
    {
      field: 'expireTime',
      title: '过期时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'website',
      title: '绑定域名',
      minWidth: 180,
    },
    {
      field: 'status',
      title: '租户状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 130,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '租户',
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
    },
  ];
}
