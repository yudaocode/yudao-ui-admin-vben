import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';

import { useAccess } from '@vben/access';

import { getAppList } from '#/api/pay/app';
import { DICT_TYPE, getDictOptions } from '#/utils';

const { hasAccessByCodes } = useAccess();

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
      component: 'DatePicker',
      componentProps: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = any>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '任务编号',
      minWidth: 100,
    },
    {
      field: 'appName',
      title: '应用编号',
      minWidth: 120,
    },
    {
      field: 'merchantOrderId',
      title: '商户订单编号',
      minWidth: 180,
    },
    {
      field: 'type',
      title: '通知类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_NOTIFY_TYPE },
      },
    },
    {
      field: 'dataId',
      title: '关联编号',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '通知状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_NOTIFY_STATUS },
      },
    },
    {
      field: 'lastExecuteTime',
      title: '最后通知时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'nextNotifyTime',
      title: '下次通知时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'notifyTimes',
      title: '通知次数',
      minWidth: 120,
      cellRender: {
        name: 'CellTag',
        props: {
          type: 'success',
          content: '{notifyTimes} / {maxNotifyTimes}',
        },
      },
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 100,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            show: hasAccessByCodes(['pay:notify:query']),
          },
        ],
      },
    },
  ];
}

/** 详情列表的字段 */
export const detailColumns = [
  {
    label: '日志编号',
    prop: 'id',
    key: 'id',
  },
  {
    label: '通知状态',
    prop: 'status',
    key: 'status',
  },
  {
    label: '通知次数',
    prop: 'notifyTimes',
    key: 'notifyTimes',
  },
  {
    label: '通知时间',
    prop: 'lastExecuteTime',
    key: 'lastExecuteTime',
  },
  {
    label: '响应结果',
    prop: 'response',
    key: 'response',
  },
];
