import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemTenantApi } from '#/api/system/tenant';

import { useAccess } from '@vben/access';

import { z } from '#/adapter/form';
import { getTenantPackageList } from '#/api/system/tenant-package';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

const { hasAccessByCodes } = useAccess();

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
        // TODO @xingyu：系统租户的情况
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
      fieldName: 'website',
      component: 'Input',
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
    // TODO @xingyu：时间检索，有问题
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
export function useGridColumns<T = SystemTenantApi.Tenant>(
  onActionClick: OnActionClickFn<T>,
  getPackageName?: (packageId: number) => string | undefined,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '租户编号',
      minWidth: 100,
    },
    {
      field: 'name',
      title: '租户名',
      minWidth: 180,
    },
    {
      field: 'packageId',
      title: '租户套餐',
      minWidth: 180,
      formatter: (row: { cellValue: number }) => {
        return getPackageName?.(row.cellValue) || '-';
      },
    },
    {
      field: 'contactName',
      title: '联系人',
      minWidth: 100,
    },
    {
      field: 'contactMobile',
      title: '联系手机',
      minWidth: 180,
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
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['system:tenant:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['system:tenant:delete']),
          },
        ],
      },
    },
  ];
}
