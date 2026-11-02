import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { AiModelTypeEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { getModelSimpleList } from '#/api/ai/model/model';
import { getSimpleUserList } from '#/api/system/user';
import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';
import { formatTokenCount } from '#/views/ai/utils/format';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'requestId',
      label: '请求编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入请求编号',
      },
    },
    {
      fieldName: 'userId',
      label: '用户',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
        showSearch: true,
        optionFilterProp: 'label',
        allowClear: true,
        placeholder: '请选择用户',
      },
    },
    {
      fieldName: 'bizType',
      label: '业务类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.AI_REQUEST_LOG_BIZ_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择业务类型',
      },
    },
    {
      fieldName: 'platform',
      label: '模型平台',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.AI_PLATFORM, 'string'),
        allowClear: true,
        placeholder: '请选择模型平台',
      },
    },
    {
      fieldName: 'modelId',
      label: '模型',
      component: 'ApiSelect',
      componentProps: {
        api: () => getModelSimpleList(AiModelTypeEnum.CHAT),
        labelField: 'name',
        valueField: 'id',
        showSearch: true,
        optionFilterProp: 'label',
        allowClear: true,
        placeholder: '请选择模型',
      },
    },
    {
      fieldName: 'model',
      label: '模型标识',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入模型标识',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.AI_REQUEST_LOG_STATUS, 'number'),
        allowClear: true,
        placeholder: '全部（含失败、取消）',
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
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'beginTime',
      title: '请求时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      field: 'bizType',
      title: '业务类型',
      minWidth: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_REQUEST_LOG_BIZ_TYPE },
      },
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_REQUEST_LOG_STATUS },
      },
    },
    {
      field: 'inputTokens',
      title: '输入 Token',
      minWidth: 100,
      formatter: ({ cellValue }) => formatTokenCount(cellValue),
    },
    {
      field: 'outputTokens',
      title: '输出 Token',
      minWidth: 100,
      formatter: ({ cellValue }) => formatTokenCount(cellValue),
    },
    {
      field: 'totalTokens',
      title: '合计 Token',
      minWidth: 100,
      formatter: ({ cellValue }) => formatTokenCount(cellValue),
    },
    {
      field: 'duration',
      title: '耗时',
      minWidth: 90,
      formatter: ({ cellValue }) =>
        cellValue === null || cellValue === undefined ? '' : `${cellValue} ms`,
    },
    {
      field: 'platform',
      title: '平台',
      minWidth: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_PLATFORM },
      },
    },
    {
      field: 'model',
      title: '模型标识',
      width: 140,
      showOverflow: 'tooltip',
    },
    {
      field: 'userId',
      title: '用户',
      minWidth: 100,
      formatter: ({ cellValue, row }) => row.userNickname ?? cellValue ?? '',
    },
    {
      field: 'requestId',
      title: '请求编号',
      width: 140,
      showOverflow: 'tooltip',
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
      label: '日志编号',
    },
    {
      field: 'status',
      label: '状态',
      render: (val) =>
        h(DictTag, { type: DICT_TYPE.AI_REQUEST_LOG_STATUS, value: val }),
    },
    {
      field: 'requestId',
      label: '请求编号',
      span: 2,
      slot: 'requestId',
    },
    {
      field: 'bizType',
      label: '业务类型',
      render: (val) =>
        h(DictTag, { type: DICT_TYPE.AI_REQUEST_LOG_BIZ_TYPE, value: val }),
    },
    {
      field: 'bizId',
      label: '业务编号',
    },
    {
      field: 'userId',
      label: '用户编号',
      span: 2,
    },
    {
      field: 'platform',
      label: '模型平台',
      render: (val) => h(DictTag, { type: DICT_TYPE.AI_PLATFORM, value: val }),
    },
    {
      field: 'modelId',
      label: '模型编号',
    },
    {
      field: 'model',
      label: '模型标识',
      span: 2,
    },
    {
      field: 'beginTime',
      label: '开始时间',
      render: (val) => formatDateTime(val),
    },
    {
      field: 'endTime',
      label: '结束时间',
      render: (val) => formatDateTime(val),
    },
    {
      field: 'duration',
      label: '耗时',
      span: 2,
      render: (val) => (val === null || val === undefined ? '' : `${val} ms`),
    },
    {
      field: 'errorMessage',
      label: '错误信息',
      span: 2,
      show: (data) => !!data?.errorMessage,
      render: (val) =>
        h('span', { class: 'whitespace-pre-wrap text-red-500' }, val),
    },
    {
      field: 'inputTokens',
      label: '输入 Token',
      render: (val) => formatTokenCount(val),
    },
    {
      field: 'outputTokens',
      label: '输出 Token',
      render: (val) => formatTokenCount(val),
    },
    {
      field: 'totalTokens',
      label: '合计 Token',
      span: 2,
      render: (val) => formatTokenCount(val),
    },
    {
      field: 'createTime',
      label: '创建时间',
      span: 2,
      render: (val) => formatDateTime(val),
    },
  ];
}
