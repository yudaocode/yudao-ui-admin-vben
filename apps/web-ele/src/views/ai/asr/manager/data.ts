import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiAsrApi } from '#/api/ai/asr';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { AiAsrStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { getSimpleUserList } from '#/api/system/user';
import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';

/** 识别耗时：毫秒转秒 */
export function formatAsrDuration(duration?: null | number) {
  if (duration === undefined || duration === null) {
    return '-';
  }
  return `${(duration / 1000).toFixed(1)} 秒`;
}

/** 识别状态的名字 */
export function getAsrStatusLabel(status?: number) {
  return status === AiAsrStatusEnum.SUCCESS ? '识别成功' : '识别失败';
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
        placeholder: '请选择用户',
        filterable: true,
        clearable: true,
      },
    },
    {
      fieldName: 'platform',
      label: '平台',
      component: 'Select',
      componentProps: {
        placeholder: '请选择平台',
        clearable: true,
        options: getDictOptions(DICT_TYPE.AI_PLATFORM, 'string'),
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '识别成功', value: AiAsrStatusEnum.SUCCESS },
          { label: '识别失败', value: AiAsrStatusEnum.FAIL },
        ],
      },
    },
    {
      fieldName: 'fileName',
      label: '文件名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入文件名',
        clearable: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<AiAsrApi.Asr>['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 90,
      fixed: 'left',
    },
    {
      field: 'fileName',
      title: '文件名',
      minWidth: 200,
    },
    {
      field: 'userNickname',
      title: '用户',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      align: 'center',
      slots: { default: 'status' },
    },
    {
      field: 'platform',
      title: '平台',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_PLATFORM },
      },
    },
    {
      field: 'modelName',
      title: '模型',
      minWidth: 160,
      formatter: ({ row }) => row.modelName || row.model || '-',
    },
    {
      field: 'duration',
      title: '耗时',
      width: 100,
      align: 'center',
      formatter: ({ cellValue }) => formatAsrDuration(cellValue),
    },
    {
      field: 'originalText',
      title: '识别文本',
      minWidth: 240,
      slots: { default: 'originalText' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'id',
      label: '编号',
    },
    {
      field: 'userNickname',
      label: '用户',
      render: (val) => val || '-',
    },
    {
      field: 'status',
      label: '状态',
      render: (val) =>
        val === undefined || val === null ? '-' : getAsrStatusLabel(val),
    },
    {
      field: 'platform',
      label: '平台',
      render: (val) =>
        val ? h(DictTag, { type: DICT_TYPE.AI_PLATFORM, value: val }) : '-',
    },
    {
      field: 'modelName',
      label: '模型',
      render: (_val, data) => data?.modelName || data?.model || '-',
    },
    {
      field: 'duration',
      label: '耗时',
      render: (val) => formatAsrDuration(val),
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (val) => (val ? formatDateTime(val) : '-'),
    },
    {
      field: 'updateTime',
      label: '更新时间',
      render: (val) => (val ? formatDateTime(val) : '-'),
    },
    {
      field: 'fileName',
      label: '文件名',
      span: 2,
      render: (val) => val || '-',
    },
    {
      field: 'errorMessage',
      label: '失败原因',
      span: 2,
      show: (data) => data?.status === AiAsrStatusEnum.FAIL,
      render: (val) =>
        h('span', { class: 'text-[var(--el-color-danger)]' }, val || '-'),
    },
    {
      field: 'audioUrl',
      label: '音频',
      span: 2,
      slot: 'audioUrl',
    },
    {
      field: 'originalText',
      label: '识别原文',
      span: 2,
      render: (val) =>
        val
          ? h(
              'div',
              {
                class:
                  'max-h-[240px] overflow-y-auto whitespace-pre-wrap leading-5',
              },
              val,
            )
          : '-',
    },
  ];
}
