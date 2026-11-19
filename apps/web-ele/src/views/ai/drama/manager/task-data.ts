import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiDramaTaskApi } from '#/api/ai/drama/task';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getModelSimpleList } from '#/api/ai/model/model';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';

/** 镜头视频：唯一支持同步的任务类型 */
export const STORYBOARD_TASK_TYPE = 4;
/** 成片合成：重新提交不保留原合成的参数 */
export const COMPOSE_TASK_TYPE = 5;

/** 列表的搜索表单 */
export function useTaskGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      label: '任务类型',
      component: 'Select',
      componentProps: {
        placeholder: '全部类型',
        clearable: true,
        options: getDictOptions(DICT_TYPE.AI_DRAMA_TASK_TYPE, 'number'),
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        clearable: true,
        options: getDictOptions(DICT_TYPE.AI_DRAMA_STATUS, 'number'),
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
        placeholder: '请选择用户',
        clearable: true,
        filterable: true,
      },
    },
    {
      fieldName: 'projectId',
      label: '项目编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入项目编号',
        clearable: true,
      },
    },
    {
      fieldName: 'modelId',
      label: '模型',
      component: 'ApiSelect',
      componentProps: {
        api: getModelSimpleList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择模型',
        clearable: true,
        filterable: true,
      },
      help: '按模型筛选时，不含成片合成（合成不使用模型）',
    },
    {
      fieldName: 'updateTime',
      label: '更新时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 列表的字段；getModelName 根据模型编号获得模型名 */
export function useTaskGridColumns(
  getModelName: (modelId?: number) => number | string,
): VxeTableGridOptions<AiDramaTaskApi.Task>['columns'] {
  return [
    {
      field: 'type',
      title: '类型',
      width: 100,
      fixed: 'left',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_DRAMA_TASK_TYPE },
      },
    },
    {
      field: 'id',
      title: '编号',
      width: 90,
    },
    {
      field: 'projectName',
      title: '项目',
      minWidth: 150,
      formatter: ({ row }) => `${row.projectName || '-'}（${row.projectId}）`,
    },
    {
      field: 'userNickname',
      title: '用户',
      minWidth: 110,
    },
    {
      field: 'title',
      title: '名称',
      minWidth: 140,
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      slots: { default: 'status' },
    },
    {
      field: 'modelId',
      title: '模型',
      minWidth: 140,
      formatter: ({ row }) => String(getModelName(row.modelId)),
    },
    {
      field: 'prompt',
      title: '提示词',
      minWidth: 200,
      align: 'left',
    },
    {
      field: 'taskId',
      title: '服务商任务',
      minWidth: 160,
    },
    {
      field: 'resultUrl',
      title: '结果',
      width: 90,
      slots: { default: 'resultUrl' },
    },
    {
      field: 'errorMessage',
      title: '失败原因',
      minWidth: 200,
      align: 'left',
      slots: { default: 'errorMessage' },
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
