import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraApiErrorLogApi } from '#/api/infra/api-error-log';

import { useAccess } from '@vben/access';

import {
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
  InfraApiErrorLogProcessStatusEnum,
} from '#/utils';

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
      fieldName: 'exceptionTime',
      label: '异常时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'processStatus',
      label: '处理状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS,
          'number',
        ),
        allowClear: true,
        placeholder: '请选择处理状态',
      },
      defaultValue: InfraApiErrorLogProcessStatusEnum.INIT,
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = InfraApiErrorLogApi.ApiErrorLog>(
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
      minWidth: 200,
    },
    {
      field: 'exceptionTime',
      title: '异常发生时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'exceptionName',
      title: '异常名',
      minWidth: 180,
    },
    {
      field: 'processStatus',
      title: '处理状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS },
      },
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 200,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'id',
          nameTitle: 'API错误日志',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '详情',
            show: hasAccessByCodes(['infra:api-error-log:query']),
          },
          {
            code: 'done',
            text: '已处理',
            show: (row: InfraApiErrorLogApi.ApiErrorLog) => {
              return (
                row.processStatus === InfraApiErrorLogProcessStatusEnum.INIT &&
                hasAccessByCodes(['infra:api-error-log:update-status'])
              );
            },
          },
          {
            code: 'ignore',
            text: '已忽略',
            show: (row: InfraApiErrorLogApi.ApiErrorLog) => {
              return (
                row.processStatus === InfraApiErrorLogProcessStatusEnum.INIT &&
                hasAccessByCodes(['infra:api-error-log:update-status'])
              );
            },
          },
        ],
      },
    },
  ];
}
