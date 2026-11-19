import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiVideoApi } from '#/api/ai/video';

import { useAccess } from '@vben/access';
import { AiVideoStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';

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
        clearable: true,
        filterable: true,
      },
    },
    {
      fieldName: 'type',
      label: '创作类型',
      component: 'Select',
      componentProps: {
        placeholder: '请选择创作类型',
        clearable: true,
        options: getDictOptions(DICT_TYPE.AI_VIDEO_TYPE, 'number'),
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
        options: getDictOptions(DICT_TYPE.AI_VIDEO_STATUS, 'number'),
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
      fieldName: 'prompt',
      label: '提示词',
      component: 'Input',
      componentProps: {
        placeholder: '请输入提示词',
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
    row: AiVideoApi.Video,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions<AiVideoApi.Video>['columns'] {
  const { hasAccessByCodes } = useAccess();
  return [
    {
      field: 'id',
      title: '编号',
      width: 90,
      fixed: 'left',
    },
    {
      field: 'videoUrl',
      title: '视频',
      width: 100,
      slots: { default: 'videoUrl' },
    },
    {
      field: 'userNickname',
      title: '用户',
      minWidth: 120,
    },
    {
      field: 'type',
      title: '创作类型',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_VIDEO_TYPE },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_VIDEO_STATUS },
      },
    },
    {
      field: 'platform',
      title: '平台',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_PLATFORM },
      },
    },
    {
      field: 'model',
      title: '模型',
      minWidth: 160,
    },
    {
      field: 'prompt',
      title: '提示词',
      minWidth: 200,
      align: 'left',
    },
    {
      field: 'duration',
      title: '时长',
      width: 80,
      formatter: ({ cellValue }) => (cellValue ? `${cellValue} 秒` : '-'),
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
          disabled: (row: AiVideoApi.Video) =>
            row.status !== AiVideoStatusEnum.SUCCESS ||
            !hasAccessByCodes(['ai:video:update']),
          activeValue: true,
          inactiveValue: false,
          activeText: '是',
          inactiveText: '否',
        },
      },
    },
    {
      field: 'errorMessage',
      title: '失败原因',
      minWidth: 200,
      align: 'left',
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
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
