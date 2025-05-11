import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemSmsLogApi } from '#/api/system/sms/log';

import { useAccess } from '@vben/access';

import { getSimpleSmsChannelList } from '#/api/system/sms/channel';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入手机号',
      },
    },
    {
      fieldName: 'channelId',
      label: '短信渠道',
      component: 'ApiSelect',
      componentProps: {
        api: async () => await getSimpleSmsChannelList(),
        labelField: 'signature',
        valueField: 'id',
        allowClear: true,
        placeholder: '请选择短信渠道',
      },
    },
    {
      fieldName: 'templateId',
      label: '模板编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入模板编号',
      },
    },
    {
      fieldName: 'sendStatus',
      label: '发送状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_SMS_SEND_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择发送状态',
      },
    },
    {
      fieldName: 'sendTime',
      label: '发送时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'receiveStatus',
      label: '接收状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择接收状态',
      },
    },
    {
      fieldName: 'receiveTime',
      label: '接收时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = SystemSmsLogApi.SmsLog>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      minWidth: 100,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'mobile',
      title: '手机号',
      minWidth: 120,
    },
    {
      field: 'templateContent',
      title: '短信内容',
      minWidth: 300,
    },
    {
      field: 'sendStatus',
      title: '发送状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_SMS_SEND_STATUS },
      },
    },
    {
      field: 'sendTime',
      title: '发送时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'receiveStatus',
      title: '接收状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS },
      },
    },
    {
      field: 'receiveTime',
      title: '接收时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'channelCode',
      title: '短信渠道',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE },
      },
    },
    {
      field: 'templateId',
      title: '模板编号',
      minWidth: 100,
    },
    {
      field: 'templateType',
      title: '短信类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE },
      },
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 120,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'mobile',
          nameTitle: '短信日志',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '详情',
            show: hasAccessByCodes(['system:sms-log:query']),
          },
        ],
      },
    },
  ];
}
