import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraApiAccessLogApi } from '#/api/infra/api-access-log';

import { useAccess } from '@vben/access';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户编号',
      },
    },
    {
      fieldName: 'userType',
      label: '用户类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.USER_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择用户类型',
      },
    },
    {
      fieldName: 'applicationName',
      label: '应用名',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入应用名',
      },
    },
    {
      fieldName: 'beginTime',
      label: '请求时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'duration',
      label: '执行时长',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入执行时长',
      },
    },
    {
      fieldName: 'resultCode',
      label: '结果码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入结果码',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = InfraApiAccessLogApi.ApiAccessLog>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '日志编号',
      minWidth: 100,
    },
    {
      field: 'userId',
      title: '用户编号',
      minWidth: 100,
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
      field: 'applicationName',
      title: '应用名',
      minWidth: 150,
    },
    {
      field: 'requestMethod',
      title: '请求方法',
      minWidth: 80,
    },
    {
      field: 'requestUrl',
      title: '请求地址',
      minWidth: 300,
    },
    {
      field: 'beginTime',
      title: '请求时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'duration',
      title: '执行时长',
      minWidth: 120,
      formatter: ({ row }) => `${row.duration} ms`,
    },
    {
      field: 'resultCode',
      title: '操作结果',
      minWidth: 150,
      formatter: ({ row }) => {
        return row.resultCode === 0 ? '成功' : `失败(${row.resultMsg})`;
      },
    },
    {
      field: 'operateModule',
      title: '操作模块',
      minWidth: 150,
    },
    {
      field: 'operateName',
      title: '操作名',
      minWidth: 220,
    },
    {
      field: 'operateType',
      title: '操作类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_OPERATE_TYPE },
      },
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 80,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'id',
          nameTitle: 'API访问日志',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '详情',
            show: hasAccessByCodes(['infra:api-access-log:query']),
          },
        ],
      },
    },
  ];
}
