import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { formatDateTime } from '@vben/utils';

import { getSimpleMailAccountList } from '#/api/system/mail/account';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
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
      fieldName: 'sendStatus',
      label: '发送状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_MAIL_SEND_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择发送状态',
      },
    },
    {
      fieldName: 'accountId',
      label: '邮箱账号',
      component: 'ApiSelect',
      componentProps: {
        api: async () => await getSimpleMailAccountList(),
        labelField: 'mail',
        valueField: 'id',
        allowClear: true,
        placeholder: '请选择邮箱账号',
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
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
    },
    {
      field: 'sendTime',
      title: '发送时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'userType',
      title: '接收用户',
      width: 150,
      slots: { default: 'userInfo' },
    },
    {
      field: 'toMails',
      title: '接收信息',
      width: 300,
      formatter: ({ row }) => {
        const lines: string[] = [];
        if (row.toMails && row.toMails.length > 0) {
          lines.push(`收件：${row.toMails.join('、')}`);
        }
        if (row.ccMails && row.ccMails.length > 0) {
          lines.push(`抄送：${row.ccMails.join('、')}`);
        }
        if (row.bccMails && row.bccMails.length > 0) {
          lines.push(`密送：${row.bccMails.join('、')}`);
        }
        return lines.join('\n');
      },
    },
    {
      field: 'templateTitle',
      title: '邮件标题',
    },
    {
      field: 'templateContent',
      title: '邮件内容',
    },
    {
      field: 'fromMail',
      title: '发送邮箱',
    },
    {
      field: 'sendStatus',
      title: '发送状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_MAIL_SEND_STATUS },
      },
    },
    {
      field: 'templateCode',
      title: '模板编码',
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 详情页的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'id',
      label: '编号',
    },
    {
      field: 'createTime',
      label: '创建时间',
      content: (data) => formatDateTime(data?.createTime || '') as string,
    },
    {
      field: 'fromMail',
      label: '发送邮箱',
    },
    {
      field: 'userId',
      label: '接收用户',
      content: (data) => {
        if (data?.userType && data?.userId) {
          return h('div', [
            h(DictTag, {
              type: DICT_TYPE.USER_TYPE,
              value: data.userType,
            }),
            ` (${data.userId})`,
          ]);
        }
        return '无';
      },
    },
    {
      field: 'toMails',
      label: '接收信息',
      content: (data) => {
        const lines: string[] = [];
        if (data?.toMails && data.toMails.length > 0) {
          lines.push(`收件：${data.toMails.join('、')}`);
        }
        if (data?.ccMails && data.ccMails.length > 0) {
          lines.push(`抄送：${data.ccMails.join('、')}`);
        }
        if (data?.bccMails && data.bccMails.length > 0) {
          lines.push(`密送：${data.bccMails.join('、')}`);
        }
        return h(
          'div',
          {
            style: { whiteSpace: 'pre-line' },
          },
          lines.join('\n'),
        );
      },
    },
    {
      field: 'templateId',
      label: '模板编号',
    },
    {
      field: 'templateCode',
      label: '模板编码',
    },
    {
      field: 'templateTitle',
      label: '邮件标题',
    },
    {
      field: 'templateContent',
      label: '邮件内容',
      content: (data) => {
        // 渲染HTML内容
        return h('div', {
          innerHTML: data?.templateContent || '',
        });
      },
    },
    {
      field: 'sendStatus',
      label: '发送状态',
      content: (data) => {
        return h(DictTag, {
          type: DICT_TYPE.SYSTEM_MAIL_SEND_STATUS,
          value: data?.sendStatus,
        });
      },
    },
    {
      field: 'sendTime',
      label: '发送时间',
      content: (data) => formatDateTime(data?.sendTime || '') as string,
    },
    {
      field: 'sendMessageId',
      label: '发送消息编号',
    },
    {
      field: 'sendException',
      label: '发送异常',
    },
  ];
}
