import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkbenchApi } from '#/api/pms/pm/workbench';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';
import IterationSelect from '#/views/pms/pm/iteration/components/iteration-select.vue';
import { PmsWorkItemStatusType } from '#/views/pms/pm/utils/constants';

import ProjectSelect from './components/project-select.vue';

/** 列表的搜索表单 */
export function useSearchFormSchema(
  onProjectChange: () => void,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'projectId',
      label: '项目',
      component: markRaw(ProjectSelect),
      componentProps: () => ({
        onChange: onProjectChange,
      }),
    },
    {
      fieldName: 'name',
      label: '事项',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '搜索标题或编号',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '未开始', value: PmsWorkItemStatusType.PENDING },
          { label: '进行中', value: PmsWorkItemStatusType.PROCESSING },
          { label: '已完成', value: PmsWorkItemStatusType.COMPLETED },
        ],
        placeholder: '全部状态',
      },
    },
    {
      fieldName: 'priority',
      label: '优先级',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, 'number').map(
          (item) => ({
          label: item.label,
          value: item.value,
          }),
        ),
        placeholder: '全部优先级',
      },
    },
    {
      fieldName: 'iterationId',
      label: '迭代',
      component: markRaw(IterationSelect),
      dependencies: {
        triggerFields: ['projectId'],
        show: (values) => !!values.projectId,
        componentProps: (values) => ({
          placeholder: '全部迭代',
          projectId: values.projectId,
        }),
      },
    },
    {
      fieldName: 'endTime',
      label: '截止日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 工作项列表的字段 */
export function useWorkItemColumns(): VxeTableGridOptions<PmsWorkbenchApi.WorkbenchWorkItem>['columns'] {
  return [
    {
      field: 'serialNumber',
      title: 'ID',
      width: 90,
      slots: { default: 'serialNumber' },
    },
    {
      field: 'name',
      title: '标题',
      minWidth: 200,
      slots: { default: 'name' },
    },
    {
      field: 'priority',
      title: '优先级',
      width: 120,
      slots: { default: 'priority' },
    },
    {
      field: 'statusId',
      title: '状态',
      width: 140,
      slots: { default: 'statusId' },
    },
    {
      field: 'assigneeUserId',
      title: '处理人',
      width: 150,
      slots: { default: 'assigneeUserId' },
    },
    {
      field: 'creatorUserName',
      title: '创建人',
      width: 120,
    },
    {
      field: 'projectName',
      title: '所属项目',
      minWidth: 160,
    },
    {
      field: 'endTime',
      title: '截止日期',
      width: 190,
      slots: { default: 'endTime' },
    },
    {
      field: 'createTime',
      title: '创建日期',
      width: 180,
      slots: { default: 'createTime' },
    },
  ];
}

/** 迭代列表的字段 */
export function useIterationColumns(): VxeTableGridOptions<PmsWorkbenchApi.WorkbenchWorkItem>['columns'] {
  return [
    {
      field: 'id',
      title: 'ID',
      width: 100,
    },
    {
      field: 'name',
      title: '标题',
      minWidth: 200,
      slots: { default: 'iterationName' },
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_ITERATION_STATUS },
      },
    },
    {
      field: 'projectName',
      title: '所属项目',
      minWidth: 160,
    },
    {
      field: 'startTime',
      title: '开始日期',
      width: 180,
      slots: { default: 'iterationStartTime' },
    },
    {
      field: 'endTime',
      title: '截止日期',
      width: 180,
      slots: { default: 'iterationEndTime' },
    },
  ];
}
