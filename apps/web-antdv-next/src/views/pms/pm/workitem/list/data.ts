import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { PmsProjectType } from '#/views/pms/pm/utils/constants';

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsWorkItemApi.WorkItem>['columns'] {
  return [
    {
      field: 'serialNumber',
      title: '编号',
      width: 90,
      slots: { default: 'serialNumber' },
    },
    {
      field: 'type',
      title: '类型',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_WORK_ITEM_TYPE },
      },
    },
    {
      field: 'name',
      title: '标题',
      width: 240,
      slots: { default: 'name' },
    },
    {
      field: 'statusName',
      title: '状态',
      width: 120,
    },
    {
      field: 'priority',
      title: '优先级',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_WORK_ITEM_PRIORITY },
      },
    },
    {
      field: 'assigneeUserName',
      title: '负责人',
      width: 110,
    },
    {
      field: 'iterationName',
      title: '所属迭代',
      width: 130,
    },
    {
      field: 'progress',
      title: '进度',
      width: 140,
      slots: { default: 'progress' },
    },
    {
      field: 'endTime',
      title: '截止时间',
      width: 180,
      // TODO @AI：同文件 useWorkItemGridColumns 已用 formatter: 'formatDateTime'，这里不要再 slots，两套列定义对齐。
      formatter: 'formatDateTime',
    },
  ];
}

/** 工作项列表的字段 */
export function useWorkItemGridColumns(
  type: number,
  projectType: number,
): VxeTableGridOptions<PmsWorkItemApi.WorkItem>['columns'] {
  const workItemTypeName =
    getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, type) || '-';
  return [
    {
      field: 'serialNumber',
      title: `${workItemTypeName}编号`,
      width: 100,
      slots: { default: 'serialNumber' },
    },
    {
      field: 'name',
      title: `${workItemTypeName}标题`,
      minWidth: 220,
      slots: { default: 'name' },
    },
    {
      field: 'priority',
      title: '优先级',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_WORK_ITEM_PRIORITY },
      },
    },
    {
      field: 'statusId',
      title: '状态',
      width: 140,
      slots: { default: 'status' },
    },
    {
      field: 'assigneeUserName',
      title: '负责人',
      width: 110,
    },
    {
      field: 'labels',
      title: '标签',
      width: 150,
      slots: { default: 'labels' },
    },
    ...(projectType === PmsProjectType.AGILE
      ? [
          {
            field: 'iterationName',
            title: '所属迭代',
            width: 130,
          },
        ]
      : []),
    {
      field: 'progress',
      title: '进度',
      width: 150,
      slots: { default: 'progress' },
    },
    {
      field: 'endTime',
      title: '截止时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right' as const,
      slots: { default: 'actions' },
    },
  ];
}
