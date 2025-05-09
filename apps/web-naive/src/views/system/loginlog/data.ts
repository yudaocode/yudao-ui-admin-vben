import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemLoginLogApi } from '#/api/system/login-log';

import { useAccess } from '@vben/access';

import { DICT_TYPE, getRangePickerDefaultProps } from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'username',
      label: '用户名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户名称',
      },
    },
    {
      fieldName: 'userIp',
      label: '登录地址',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入登录地址',
      },
    },
    {
      fieldName: 'createTime',
      label: '登录时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = SystemLoginLogApi.LoginLog>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '日志编号',
      minWidth: 100,
    },
    {
      field: 'logType',
      title: '操作类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_LOGIN_TYPE },
      },
    },
    {
      field: 'username',
      title: '用户名称',
      minWidth: 180,
    },
    {
      field: 'userIp',
      title: '登录地址',
      minWidth: 180,
    },
    {
      field: 'userAgent',
      title: '浏览器',
      minWidth: 200,
    },
    {
      field: 'result',
      title: '登录结果',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_LOGIN_RESULT },
      },
    },
    {
      field: 'createTime',
      title: '登录日期',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 120,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'username',
          nameTitle: '登录日志',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '详情',
            show: hasAccessByCodes(['system:login-log:query']),
          },
        ],
      },
    },
  ];
}
