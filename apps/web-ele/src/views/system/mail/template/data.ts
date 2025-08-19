import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemMailTemplateApi } from '#/api/system/mail/template';

import { useAccess } from '@vben/access';

import { z } from '#/adapter/form';
import { getSimpleMailAccountList } from '#/api/system/mail/account';
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
      label: '模板名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入模板名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'code',
      label: '模板编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入模板编码',
      },
      rules: 'required',
    },
    {
      fieldName: 'accountId',
      label: '邮箱账号',
      component: 'ApiSelect',
      componentProps: {
        api: async () => await getSimpleMailAccountList(),
        labelField: 'mail',
        valueField: 'id',
        placeholder: '请选择邮箱账号',
      },
      rules: 'required',
    },
    {
      fieldName: 'nickname',
      label: '发送人名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入发送人名称',
      },
    },
    {
      fieldName: 'title',
      label: '模板标题',
      component: 'Input',
      componentProps: {
        placeholder: '请输入模板标题',
      },
      rules: 'required',
    },
    {
      fieldName: 'content',
      label: '模板内容',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入模板内容',
        height: 300,
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '开启状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 发送邮件表单 */
export function useSendMailFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'templateParams',
      label: '模板参数',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'content',
      label: '模板内容',
      component: 'Textarea',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'toMails',
      label: '收件邮箱',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入收件邮箱，每行一个邮箱地址',
        rows: 3,
      },
    },
    {
      fieldName: 'ccMails',
      label: '抄送邮箱',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入抄送邮箱，每行一个邮箱地址',
        rows: 2,
      },
    },
    {
      fieldName: 'bccMails',
      label: '密送邮箱',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入密送邮箱，每行一个邮箱地址',
        rows: 2,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'status',
      label: '开启状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择开启状态',
      },
    },
    {
      fieldName: 'code',
      label: '模板编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入模板编码',
      },
    },
    {
      fieldName: 'name',
      label: '模板名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入模板名称',
      },
    },
    {
      fieldName: 'accountId',
      label: '邮箱账号',
      component: 'ApiSelect',
      componentProps: {
        api: async () => await getSimpleMailAccountList(),
        labelField: 'mail',
        valueField: 'id',
        allowClear: true,
        placeholder: '请选择邮箱账号',
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
export function useGridColumns<T = SystemMailTemplateApi.MailTemplate>(
  onActionClick: OnActionClickFn<T>,
  getAccountMail?: (accountId: number) => string | undefined,
): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'checkbox',
      width: 40,
    },
    {
      field: 'id',
      title: '编号',
      minWidth: 100,
    },
    {
      field: 'code',
      title: '模板编码',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '模板名称',
      minWidth: 120,
    },
    {
      field: 'title',
      title: '模板标题',
      minWidth: 120,
    },
    {
      field: 'accountId',
      title: '邮箱账号',
      minWidth: 120,
      formatter: (row) => getAccountMail?.(row.cellValue) || '-',
    },
    {
      field: 'nickname',
      title: '发送人名称',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '开启状态',
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
      minWidth: 150,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '邮件模板',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['system:mail-template:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['system:mail-template:delete']),
          },
          {
            code: 'send',
            text: '测试',
            show: hasAccessByCodes(['system:mail-template:send-mail']),
          },
        ],
      },
    },
  ];
}
