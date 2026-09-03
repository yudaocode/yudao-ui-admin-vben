import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsIterationApi } from '#/api/pms/pm/iteration';

import { DICT_TYPE } from '@vben/constants';

import { PmsIterationStatus } from '#/views/pms/pm/utils/constants';

/** 列表的搜索表单 */
export function useSearchFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '搜索迭代',
      },
    },
    {
      fieldName: 'status',
      label: '迭代状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          { label: '未开始', value: PmsIterationStatus.PLANNED },
          { label: '进行中', value: PmsIterationStatus.ACTIVE },
          { label: '已完成', value: PmsIterationStatus.COMPLETED },
        ],
        placeholder: '全部状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  editable: boolean,
): VxeTableGridOptions<PmsIterationApi.Iteration>['columns'] {
  return [
    {
      field: 'id',
      title: '引用 ID',
      width: 90,
      slots: { default: 'id' },
    },
    {
      field: 'name',
      title: '迭代名称',
      minWidth: 200,
      slots: { default: 'name' },
    },
    {
      field: 'startTime',
      title: '开始时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '结束时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_ITERATION_STATUS },
      },
    },
    {
      field: 'progress',
      title: '进度',
      width: 160,
      align: 'center',
      slots: { default: 'progress' },
    },
    {
      field: 'ownerUserName',
      title: '负责人',
      minWidth: 110,
    },
    ...(editable
      ? [
          {
            title: '操作',
            width: 90,
            align: 'center' as const,
            fixed: 'right' as const,
            slots: { default: 'actions' },
          },
        ]
      : []),
  ];
}
