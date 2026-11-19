import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiSpeechApi } from '#/api/ai/speech';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { getSimpleUserList } from '#/api/system/user';
import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';
import {
  AiSpeechStatusEnum,
  AiSpeechStatusLabels,
  formatSpeechSize,
  formatSpeechSpeed,
  getSpeechFormatLabel,
  getSpeechVoiceLabel,
} from '#/views/ai/utils/speech';

/** 状态的标签类型 */
export function getSpeechStatusTagType(status?: number) {
  if (status === AiSpeechStatusEnum.SUCCESS) {
    return 'success';
  }
  return status === AiSpeechStatusEnum.FAIL ? 'danger' : 'primary';
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
        options: Object.entries(AiSpeechStatusLabels).map(([value, label]) => ({
          label,
          value: Number(value),
        })),
      },
    },
    {
      fieldName: 'inputText',
      label: '朗读文本',
      component: 'Input',
      componentProps: {
        placeholder: '请输入朗读文本',
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
export function useGridColumns(): VxeTableGridOptions<AiSpeechApi.Speech>['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 90,
      fixed: 'left',
    },
    {
      field: 'inputText',
      title: '朗读文本',
      minWidth: 240,
      fixed: 'left',
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
      field: 'model',
      title: '模型',
      minWidth: 140,
    },
    {
      field: 'voice',
      title: '音色',
      minWidth: 160,
      formatter: ({ row }) => getSpeechVoiceLabel(row),
    },
    {
      field: 'format',
      title: '格式',
      width: 90,
      align: 'center',
      formatter: ({ cellValue }) => getSpeechFormatLabel(cellValue),
    },
    {
      field: 'speed',
      title: '语速',
      width: 80,
      align: 'center',
      formatter: ({ cellValue }) => formatSpeechSpeed(cellValue),
    },
    {
      field: 'audioSize',
      title: '音频大小',
      width: 100,
      align: 'center',
      formatter: ({ cellValue }) => formatSpeechSize(cellValue),
    },
    {
      field: 'errorMessage',
      title: '失败原因',
      minWidth: 200,
      slots: { default: 'errorMessage' },
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
        val === undefined || val === null
          ? '-'
          : AiSpeechStatusLabels[val] || '-',
    },
    {
      field: 'platform',
      label: '平台',
      render: (val) =>
        val ? h(DictTag, { type: DICT_TYPE.AI_PLATFORM, value: val }) : '-',
    },
    {
      field: 'model',
      label: '模型',
      render: (val) => val || '-',
    },
    {
      field: 'voice',
      label: '音色',
      render: (_val, data) =>
        data?.platform ? getSpeechVoiceLabel(data) : '-',
    },
    {
      field: 'format',
      label: '格式',
      render: (val) => getSpeechFormatLabel(val),
    },
    {
      field: 'speed',
      label: '语速',
      render: (val) => formatSpeechSpeed(val),
    },
    {
      field: 'audioSize',
      label: '音频大小',
      render: (val) => formatSpeechSize(val),
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (val) => (val ? formatDateTime(val) : '-'),
    },
    {
      field: 'finishTime',
      label: '完成时间',
      render: (val) => (val ? formatDateTime(val) : '-'),
    },
    {
      field: 'errorMessage',
      label: '失败原因',
      span: 2,
      show: (data) => data?.status === AiSpeechStatusEnum.FAIL,
      render: (val) =>
        h('span', { class: 'text-[var(--el-color-danger)]' }, val || '-'),
    },
    {
      field: 'inputText',
      label: '朗读文本',
      span: 2,
      render: (val) =>
        val
          ? h(
              'div',
              {
                class:
                  'max-h-[200px] overflow-y-auto whitespace-pre-wrap leading-5',
              },
              val,
            )
          : '-',
    },
    {
      field: 'audioUrl',
      label: '音频',
      span: 2,
      slot: 'audioUrl',
    },
  ];
}
