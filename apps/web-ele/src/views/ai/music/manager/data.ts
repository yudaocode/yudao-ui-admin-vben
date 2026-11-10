import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiMusicApi } from '#/api/ai/music';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { useAccess } from '@vben/access';
import {
  AiMusicStatusEnum,
  DICT_TYPE,
  isAiMusicRunning,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { getSimpleUserList } from '#/api/system/user';
import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';
import { formatMusicDuration } from '#/views/ai/utils/format';

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
      fieldName: 'title',
      label: '音乐名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入音乐名称',
        clearable: true,
      },
    },
    {
      fieldName: 'status',
      label: '音乐状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择音乐状态',
        clearable: true,
        options: getDictOptions(DICT_TYPE.AI_MUSIC_STATUS, 'number'),
      },
    },
    {
      fieldName: 'generateMode',
      label: '生成模式',
      component: 'Select',
      componentProps: {
        placeholder: '请选择生成模式',
        clearable: true,
        options: getDictOptions(DICT_TYPE.AI_GENERATE_MODE, 'number'),
      },
    },
    {
      fieldName: 'publicStatus',
      label: '是否公开',
      component: 'Select',
      componentProps: {
        placeholder: '请选择是否公开',
        clearable: true,
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
      },
    },
    {
      fieldName: 'keyword',
      label: '关键词',
      component: 'Input',
      componentProps: {
        placeholder: '描述或歌词',
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
export function useGridColumns(
  onPublicStatusChange?: (
    newStatus: boolean,
    row: AiMusicApi.Music,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions<AiMusicApi.Music>['columns'] {
  const { hasAccessByCodes } = useAccess();
  return [
    {
      field: 'id',
      title: '编号',
      width: 90,
      fixed: 'left',
    },
    {
      field: 'title',
      title: '音乐',
      minWidth: 240,
      fixed: 'left',
      showOverflow: false,
      slots: { default: 'music' },
    },
    {
      field: 'userNickname',
      title: '用户',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '音乐状态',
      width: 120,
      slots: { default: 'status' },
    },
    {
      field: 'generateMode',
      title: '生成模式',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_GENERATE_MODE },
      },
    },
    {
      field: 'model',
      title: '模型',
      minWidth: 120,
    },
    {
      field: 'duration',
      title: '时长',
      width: 80,
      formatter: ({ cellValue }) => formatMusicDuration(cellValue),
    },
    {
      field: 'publicStatus',
      title: '是否公开',
      width: 100,
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onPublicStatusChange },
        name: 'CellSwitch',
        props: {
          activeValue: true,
          inactiveValue: false,
          activeText: '公开',
          inactiveText: '私有',
          disabled: (row: AiMusicApi.Music) =>
            row.status !== AiMusicStatusEnum.SUCCESS ||
            !hasAccessByCodes(['ai:music:update']),
        },
      },
    },
    {
      field: 'playCount',
      title: '播放次数',
      width: 90,
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
      label: '音乐状态',
      render: (val, data) => {
        if (val === undefined || val === null) {
          return '-';
        }
        return h('span', [
          h(DictTag, { type: DICT_TYPE.AI_MUSIC_STATUS, value: val }),
          isAiMusicRunning(val)
            ? h(
                'span',
                { class: 'ml-2 text-[var(--el-text-color-secondary)]' },
                `${data?.progress || 0}%`,
              )
            : null,
        ]);
      },
    },
    {
      field: 'generateMode',
      label: '生成模式',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, { type: DICT_TYPE.AI_GENERATE_MODE, value: val }),
    },
    {
      field: 'model',
      label: '模型',
      render: (val) => val || '-',
    },
    {
      field: 'apiKeyName',
      label: 'API 密钥',
      render: (val) => val || '-',
    },
    {
      field: 'taskId',
      label: '任务编号',
      render: (val) => val || '-',
    },
    {
      field: 'clipId',
      label: '歌曲编号(clip)',
      render: (val) => val || '-',
    },
    {
      field: 'duration',
      label: '时长',
      render: (val) => formatMusicDuration(val),
    },
    {
      field: 'playCount',
      label: '播放次数',
      render: (val) => val ?? 0,
    },
    {
      field: 'publicStatus',
      label: '是否公开',
      render: (val) => (val ? '是' : '否'),
    },
    {
      field: 'refMusicId',
      label: '来源作品',
      render: (val, data) => {
        if (!val) {
          return '-';
        }
        const extendSeconds = data?.extendSeconds;
        return extendSeconds === undefined || extendSeconds === null
          ? String(val)
          : `${val}（从 ${formatMusicDuration(extendSeconds)} 续写）`;
      },
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (val) => formatDateTime(val),
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
      show: (data) => data?.status === AiMusicStatusEnum.FAIL,
      render: (val) =>
        h('span', { class: 'text-[var(--el-color-danger)]' }, val || '-'),
    },
    {
      field: 'coverUrl',
      label: '封面',
      span: 2,
      slot: 'coverUrl',
    },
    {
      field: 'prompt',
      label: '描述 / 风格',
      span: 2,
      render: (_val, data) => {
        if (!data?.prompt && !data?.tags) {
          return '-';
        }
        return h('div', [
          data.prompt ? h('div', data.prompt) : null,
          data.tags ? h('div', data.tags) : null,
        ]);
      },
    },
    {
      field: 'lyric',
      label: '歌词',
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
    {
      field: 'videoUrl',
      label: '视频',
      span: 2,
      slot: 'videoUrl',
    },
  ];
}
