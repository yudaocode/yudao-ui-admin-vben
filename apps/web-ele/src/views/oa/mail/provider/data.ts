import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { isServerHost } from '@vben/utils';

import { z } from '#/adapter/form';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        clearable: true,
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '名称',
      minWidth: 160,
    },
    {
      field: 'imap.host',
      title: 'IMAP 服务器',
      minWidth: 220,
      slots: { default: 'imapServer' },
    },
    {
      field: 'smtp.host',
      title: 'SMTP 服务器',
      minWidth: 220,
      slots: { default: 'smtpServer' },
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
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 连接配置分组表单 */
function useConnectionFormSchema(
  protocol: 'imap' | 'smtp',
  label: string,
  defaultPort: number,
): VbenFormSchema[] {
  return [
    {
      fieldName: `${protocol}Divider`,
      label: '',
      component: 'Divider',
      renderComponentContent: () => {
        return {
          default: () => [label],
        };
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: `${protocol}.host`,
      label: '服务器域名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入服务器域名',
      },
      rules: z
        .string()
        .min(1, '请输入服务器域名')
        .refine(isServerHost, '请输入有效的服务器域名或 IP 地址'),
    },
    {
      fieldName: `${protocol}.port`,
      label: '端口',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        max: 65_535,
        controlsPosition: 'right',
        class: '!w-full',
      },
      rules: z.number().default(defaultPort),
    },
    {
      fieldName: `${protocol}.sslEnable`,
      label: '连接加密',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: 'SSL', value: true },
          { label: 'STARTTLS', value: false },
        ],
      },
      dependencies: {
        triggerFields: [''],
        componentProps: (_values, actions) => ({
          onChange: (value: any) => {
            // SSL 与 STARTTLS 互斥，切换时同步另一开关
            actions.setFieldValue(`${protocol}.starttlsEnable`, !value);
          },
        }),
      },
      rules: z.boolean().default(true),
    },
    {
      fieldName: `${protocol}.starttlsEnable`,
      component: 'Input',
      rules: z.boolean().default(false),
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
  ];
}

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
      label: '名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入邮箱服务名称',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    ...useConnectionFormSchema('imap', 'IMAP 收信配置', 993),
    ...useConnectionFormSchema('smtp', 'SMTP 发信配置', 465),
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}
