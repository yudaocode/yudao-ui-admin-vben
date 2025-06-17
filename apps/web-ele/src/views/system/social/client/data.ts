import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemSocialClientApi } from '#/api/system/social/client';

import { useAccess } from '@vben/access';

import { z } from '#/adapter/form';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  SystemUserSocialTypeEnum,
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
      label: '应用名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入应用名',
      },
      rules: 'required',
    },
    {
      fieldName: 'socialType',
      label: '社交平台',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE, 'number'),
      },
      rules: 'required',
    },
    {
      fieldName: 'userType',
      label: '用户类型',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.USER_TYPE, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: 'required',
    },
    {
      fieldName: 'clientId',
      label: '客户端编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户端编号，对应各平台的 appKey',
      },
      rules: 'required',
    },
    {
      fieldName: 'clientSecret',
      label: '客户端密钥',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户端密钥，对应各平台的 appSecret',
      },
      rules: 'required',
    },
    {
      fieldName: 'agentId',
      label: 'agentId',
      component: 'Input',
      componentProps: {
        placeholder: '授权方的网页应用 ID，有则填',
      },
      dependencies: {
        triggerFields: ['socialType'],
        show: (values) =>
          values.socialType === SystemUserSocialTypeEnum.WECHAT_ENTERPRISE.type,
      },
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

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '应用名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入应用名',
      },
    },
    {
      fieldName: 'socialType',
      label: '社交平台',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE, 'number'),
        placeholder: '请选择社交平台',
        allowClear: true,
      },
    },
    {
      fieldName: 'userType',
      label: '用户类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.USER_TYPE, 'number'),
        placeholder: '请选择用户类型',
        allowClear: true,
      },
    },
    {
      fieldName: 'clientId',
      label: '客户端编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户端编号',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = SystemSocialClientApi.SocialClient>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'checkbox',
      width: 40,
    },
    {
      field: 'id',
      title: '编号',
      minWidth: 80,
    },
    {
      field: 'name',
      title: '应用名',
      minWidth: 120,
    },
    {
      field: 'socialType',
      title: '社交平台',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_SOCIAL_TYPE },
      },
    },
    {
      field: 'userType',
      title: '用户类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.USER_TYPE },
      },
    },
    {
      field: 'clientId',
      title: '客户端编号',
      minWidth: 180,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 80,
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
          nameTitle: '社交客户端',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['system:social-client:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['system:social-client:delete']),
          },
        ],
      },
    },
  ];
}
