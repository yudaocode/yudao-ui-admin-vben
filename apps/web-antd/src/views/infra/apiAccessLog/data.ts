import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

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
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '日志编号',
    },
    {
      field: 'userId',
      title: '用户编号',
    },
    {
      field: 'userType',
      title: '用户类型',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.USER_TYPE },
      },
    },
    {
      field: 'applicationName',
      title: '应用名',
    },
    {
      field: 'requestMethod',
      title: '请求方法',
    },
    {
      field: 'requestUrl',
      title: '请求地址',
    },
    {
      field: 'beginTime',
      title: '请求时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'duration',
      title: '执行时长',
      formatter: ({ cellValue }) => `${cellValue} ms`,
    },
    {
      field: 'resultCode',
      title: '操作结果',
      formatter: ({ row }) => {
        return row.resultCode === 0 ? '成功' : `失败(${row.resultMsg})`;
      },
    },
    {
      field: 'operateModule',
      title: '操作模块',
    },
    {
      field: 'operateName',
      title: '操作名',
    },
    {
      field: 'operateType',
      title: '操作类型',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_OPERATE_TYPE },
      },
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
