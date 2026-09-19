import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';

import MailProviderSelect from '../provider/components/mail-provider-select.vue';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'mail',
      label: '邮箱地址',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入邮箱地址',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'mail',
      title: '邮箱',
      minWidth: 220,
    },
    {
      field: 'providerId',
      title: '邮箱服务',
      minWidth: 150,
      slots: { default: 'providerName' },
    },
    {
      field: 'defaultStatus',
      title: '默认',
      width: 100,
      align: 'center',
      slots: { default: 'defaultTag' },
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
      width: 300,
      fixed: 'right',
      slots: { default: 'actions' },
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
      fieldName: 'mail',
      label: '邮箱地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入邮箱地址',
      },
      rules: z.string().min(1, '请输入邮箱地址').email('请输入正确邮箱地址'),
      dependencies: {
        // 邮箱地址仅创建时可编辑
        triggerFields: ['id'],
        componentProps: (values) => ({
          disabled: !!values.id,
        }),
      },
    },
    {
      fieldName: 'providerId',
      label: '邮箱服务',
      component: markRaw(MailProviderSelect),
      rules: 'required',
      dependencies: {
        // 邮箱服务仅创建时可编辑
        triggerFields: ['id'],
        componentProps: (values) => ({
          disabled: !!values.id,
        }),
      },
    },
    {
      fieldName: 'username',
      label: '登录名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入登录名',
      },
      rules: 'required',
      dependencies: {
        // 登录名仅创建时可编辑
        triggerFields: ['id'],
        componentProps: (values) => ({
          disabled: !!values.id,
        }),
      },
    },
    {
      fieldName: 'password',
      label: '授权码/密码',
      component: 'InputPassword',
      componentProps: {
        autocomplete: 'new-password',
      },
      dependencies: {
        // 新增时必填授权码或密码，修改时允许留空
        triggerFields: ['id'],
        componentProps: (values) => ({
          placeholder: values.id ? '留空表示不修改' : '请输入授权码或密码',
        }),
        rules: (values) => (values.id ? null : 'required'),
      },
    },
    {
      fieldName: 'defaultStatus',
      label: '设为默认',
      component: 'Checkbox',
      renderComponentContent: () => {
        return {
          default: () => ['默认账号'],
        };
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'status',
      label: '状态',
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
