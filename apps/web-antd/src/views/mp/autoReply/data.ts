import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { WxAccountSelect } from '#/views/mp/modules/wx-account-select';

import { MsgType } from './components/types';

/** 获取表格列配置 */
export function useGridColumns(msgType: MsgType): VxeGridPropTypes.Columns {
  const columns: VxeGridPropTypes.Columns = [];
  // 请求消息类型列（仅消息回复显示）
  if (msgType === MsgType.Message) {
    columns.push({
      field: 'requestMessageType',
      title: '请求消息类型',
      minWidth: 120,
    });
  }

  // 关键词列（仅关键词回复显示）
  if (msgType === MsgType.Keyword) {
    columns.push({
      field: 'requestKeyword',
      title: '关键词',
      minWidth: 150,
    });
  }

  // 匹配类型列（仅关键词回复显示）
  if (msgType === MsgType.Keyword) {
    columns.push({
      field: 'requestMatch',
      title: '匹配类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH },
      },
    });
  }

  // 回复消息类型列
  columns.push(
    {
      field: 'responseMessageType',
      title: '回复消息类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MP_MESSAGE_TYPE },
      },
    },
    {
      field: 'responseContent',
      title: '回复内容',
      minWidth: 200,
      slots: { default: 'replyContent' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  );
  return columns;
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'accountId',
      label: '公众号',
      component: markRaw(WxAccountSelect),
    },
  ];
}
