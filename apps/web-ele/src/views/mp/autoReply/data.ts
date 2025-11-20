import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { MpAccountApi } from '#/api/mp/account';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictObj, getDictOptions } from '@vben/hooks';

import { getSimpleAccountList } from '#/api/mp/account';
import { WxReplySelect } from '#/views/mp/components';

import { MsgType } from './modules/types';

/** 关联数据 */
let accountList: MpAccountApi.AccountSimple[] = [];
getSimpleAccountList().then((data) => (accountList = data));

const RequestMessageTypes = new Set([
  'image',
  'link',
  'location',
  'shortvideo',
  'text',
  'video',
  'voice',
]); // 允许选择的请求消息类型
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
      formatter: ({ cellValue }) =>
        getDictObj(DICT_TYPE.MP_MESSAGE_TYPE, String(cellValue))?.label ?? '',
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

/** 新增/修改的表单 */
export function useFormSchema(msgType: MsgType): VbenFormSchema[] {
  const schema: VbenFormSchema[] = [];
  // 消息类型（仅消息回复显示）
  if (Number(msgType) === MsgType.Message) {
    schema.push({
      fieldName: 'requestMessageType',
      label: '消息类型',
      component: 'Select',
      componentProps: {
        placeholder: '请选择',
        options: getDictOptions(DICT_TYPE.MP_MESSAGE_TYPE).filter((d) =>
          RequestMessageTypes.has(d.value as string),
        ),
      },
    });
  }

  // 匹配类型（仅关键词回复显示）
  if (Number(msgType) === MsgType.Keyword) {
    schema.push({
      fieldName: 'requestMatch',
      label: '匹配类型',
      component: 'Select',
      componentProps: {
        placeholder: '请选择匹配类型',
        allowClear: true,
        options: getDictOptions(
          DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH,
          'number',
        ),
      },
      rules: 'required',
    });
  }

  // 关键词（仅关键词回复显示）
  if (Number(msgType) === MsgType.Keyword) {
    schema.push({
      fieldName: 'requestKeyword',
      label: '关键词',
      component: 'Input',
      componentProps: {
        placeholder: '请输入内容',
        allowClear: true,
      },
      rules: 'required',
    });
  }
  // 回复消息
  schema.push({
    fieldName: 'reply',
    label: '回复消息',
    component: markRaw(WxReplySelect),
  });
  return schema;
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'accountId',
      label: '公众号',
      component: 'ApiSelect',
      componentProps: {
        options: accountList.map((item) => ({
          label: item.name,
          value: item.id,
        })),
        placeholder: '请选择公众号',
      },
      defaultValue: accountList[0]?.id,
    },
  ];
}
