import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { getAppList } from '#/api/pay/app';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'appId',
      label: '应用编号',
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const data = await getAppList();
          return data.map((item) => ({
            label: item.name,
            value: item.id,
          }));
        },
        autoSelect: 'first',
        placeholder: '请选择数据源',
      },
    },
    {
      fieldName: 'type',
      label: '通知类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.PAY_NOTIFY_TYPE, 'number'),
      },
    },
    {
      fieldName: 'dataId',
      label: '关联编号',
      component: 'Input',
    },
    {
      fieldName: 'status',
      label: '通知状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.PAY_NOTIFY_STATUS, 'number'),
      },
    },
    {
      fieldName: 'merchantOrderId',
      label: '商户订单编号',
      component: 'Input',
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
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '任务编号',
    },
    {
      field: 'appName',
      title: '应用编号',
    },
    {
      field: 'merchantOrderId',
      title: '商户订单编号',
    },
    {
      field: 'type',
      title: '通知类型',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_NOTIFY_TYPE },
      },
    },
    {
      field: 'dataId',
      title: '关联编号',
    },
    {
      field: 'status',
      title: '通知状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_NOTIFY_STATUS },
      },
    },
    {
      field: 'lastExecuteTime',
      title: '最后通知时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'nextNotifyTime',
      title: '下次通知时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'notifyTimes',
      title: '通知次数',
      cellRender: {
        name: 'CellTag',
        props: {
          type: 'success',
          content: '{notifyTimes} / {maxNotifyTimes}',
        },
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

/** 详情列表的字段 */
export const detailColumns = [
  {
    title: '日志编号',
    dataIndex: 'id',
    key: 'id',
    width: 120,
    ellipsis: false,
  },
  {
    title: '通知状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    ellipsis: false,
  },
  {
    title: '通知次数',
    dataIndex: 'notifyTimes',
    key: 'notifyTimes',
    width: 120,
    ellipsis: false,
  },
  {
    title: '通知时间',
    dataIndex: 'lastExecuteTime',
    key: 'lastExecuteTime',
    width: 120,
    ellipsis: false,
  },
  {
    title: '响应结果',
    dataIndex: 'response',
    key: 'response',
    width: 120,
    ellipsis: false,
  },
];
