import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsAccountSetApi } from '#/api/fms/config/account-set';

import { markRaw } from 'vue';

import { z } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  FMS_ACCOUNTING_STANDARD_OPTIONS,
  FMS_CURRENCY_OPTIONS,
  FMS_LEDGER_BALANCE_MODE_OPTIONS,
  FMS_SUBJECT_LEVEL_MAX,
  FMS_SUBJECT_LEVEL_MIN,
} from '#/views/fms/utils/constants';
import { UserSelect } from '#/views/system/user/components';

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsAccountSetApi.AccountSet>['columns'] {
  return [
    {
      field: 'companyName',
      title: '账套名称',
      minWidth: 220,
      slots: { default: 'companyName' },
    },
    { field: 'companyCode', title: '公司编码', minWidth: 140 },
    { field: 'contactName', title: '联系人', minWidth: 120 },
    { field: 'mobile', title: '手机号码', width: 140 },
    {
      field: 'startTime',
      title: '启用期间',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'initialized',
      title: '账套状态',
      width: 100,
      align: 'center',
      slots: { default: 'initialized' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 新增/修改账套表单 */
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
      fieldName: 'basicDivider',
      label: '',
      component: 'Divider',
      renderComponentContent: () => {
        return {
          default: () => ['基本信息'],
        };
      },
      formItemClass: 'md:col-span-2',
    },
    {
      fieldName: 'companyCode',
      label: '公司编码',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入公司编码',
        maxlength: 64,
        clearable: true,
      },
    },
    {
      fieldName: 'companyName',
      label: '公司名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入公司名称',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'companyProfile',
      label: '公司简介',
      component: 'Textarea',
      formItemClass: 'md:col-span-2',
      componentProps: {
        placeholder: '请输入公司简介',
        maxlength: 500,
        showWordLimit: true,
        rows: 3,
      },
    },
    {
      fieldName: 'industry',
      label: '所在行业',
      component: 'Input',
      componentProps: {
        placeholder: '请输入所在行业',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'location',
      label: '所在地',
      component: 'Input',
      componentProps: {
        placeholder: '请输入所在地',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'legalRepresentative',
      label: '法人代表',
      component: 'Input',
      componentProps: {
        placeholder: '请输入法人代表',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'legalRepresentativeIdNumber',
      label: '法人身份证号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入法人身份证号',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'businessLicenseNumber',
      label: '营业执照号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入营业执照号',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'organizationCode',
      label: '组织机构代码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入组织机构代码',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'md:col-span-2',
      componentProps: {
        placeholder: '请输入备注',
        maxlength: 500,
        rows: 2,
      },
    },
    {
      fieldName: 'contactDivider',
      label: '',
      component: 'Divider',
      renderComponentContent: () => {
        return {
          default: () => ['联系方式'],
        };
      },
      formItemClass: 'md:col-span-2',
    },
    {
      fieldName: 'contactName',
      label: '联系人',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系人',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'officeTelephone',
      label: '办公电话',
      component: 'Input',
      componentProps: {
        placeholder: '请输入办公电话',
        maxlength: 32,
        clearable: true,
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号码',
        maxlength: 32,
        clearable: true,
      },
    },
    {
      fieldName: 'faxNumber',
      label: '传真号码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入传真号码',
        maxlength: 32,
        clearable: true,
      },
    },
    {
      fieldName: 'qqNumber',
      label: 'QQ 号码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入 QQ 号码',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
      rules: z.string().email('邮箱格式不正确').or(z.literal('')).optional(),
      componentProps: {
        placeholder: '请输入邮箱',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'otherContact',
      label: '其他',
      component: 'Input',
      componentProps: {
        placeholder: '请输入其他联系方式',
        maxlength: 255,
        clearable: true,
      },
    },
    {
      fieldName: 'address',
      label: '详细地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入详细地址',
        maxlength: 255,
        clearable: true,
      },
    },
  ];
}

/** 初始化账套表单 */
export function useInitializeFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'companyName',
      label: '公司名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'currencyCode',
      label: '本位币',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: [...FMS_CURRENCY_OPTIONS],
        disabled: true,
      },
    },
    {
      fieldName: 'startTime',
      label: '启用期间',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        type: 'month',
        format: 'YYYY-MM',
        valueFormat: 'x',
        placeholder: '请选择启用期间',
      },
    },
    {
      fieldName: 'standard',
      label: '会计制度',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: [...FMS_ACCOUNTING_STANDARD_OPTIONS],
        placeholder: '请选择会计制度',
      },
    },
    {
      fieldName: 'level',
      label: '科目级次',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: Array.from(
          { length: FMS_SUBJECT_LEVEL_MAX - FMS_SUBJECT_LEVEL_MIN + 1 },
          (_, index) => {
            const level = FMS_SUBJECT_LEVEL_MIN + index;
            return { label: `${level} 级`, value: level };
          },
        ),
        placeholder: '请选择科目级次',
      },
    },
    {
      fieldName: 'subjectCodeRule',
      label: '科目编码规则',
      component: 'Input',
      rules: z
        .string()
        .min(1, { message: '科目编码规则不能为空' })
        .regex(/^([2-5]-)*[2-5]$/, {
          message: '各级编码长度必须为 2 至 5 位',
        }),
      componentProps: {
        placeholder: '例如：4-2-2-2',
      },
    },
    {
      fieldName: 'ledgerBalanceMode',
      label: '余额方向',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: [...FMS_LEDGER_BALANCE_MODE_OPTIONS],
        placeholder: '请选择账簿余额方向',
      },
    },
  ];
}

/** 添加账套成员表单 */
export function useAddMemberFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userIds',
      label: '选择用户',
      component: markRaw(UserSelect),
      rules: 'required',
      defaultValue: [],
      componentProps: {
        multiple: true,
        placeholder: '请选择需要加入账套的用户',
      },
    },
    {
      fieldName: 'level',
      label: '权限级别',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.FMS_ACCOUNT_USER_LEVEL, 'number').map(
          ({ label, value }) => ({ label, value: Number(value) }),
        ),
        placeholder: '请选择权限级别',
      },
    },
  ];
}
