import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmTaskApi } from '#/api/bpm/task';

import { getCategorySimpleList } from '#/api/bpm/category';
import {
  DICT_TYPE,
  formatPast2,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '任务名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'processDefinitionId',
      label: '所属流程',
      component: 'Input',
      componentProps: {
        placeholder: '请输入流程定义的编号',
        allowClear: true,
      },
    },
    {
      fieldName: 'category',
      label: '流程分类',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请输入流程分类',
        allowClear: true,
        api: getCategorySimpleList,
        labelField: 'name',
        valueField: 'code',
      },
    },
    {
      fieldName: 'status',
      label: '流程状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
          'number',
        ),
        placeholder: '请选择流程状态',
        allowClear: true,
      },
    },
    // 发起时间
    {
      fieldName: 'createTime',
      label: '发起时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = BpmTaskApi.TaskVO>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'processInstance.name',
      title: '流程',
      minWidth: 200,
      fixed: 'left',
    },
    {
      field: 'processInstance.summary',
      title: '摘要',
      minWidth: 200,
      slots: {
        default: 'slot-summary',
      },
    },
    {
      field: 'processInstance.startUser.nickname',
      title: '发起人',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '发起时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'name',
      title: '当前任务',
      minWidth: 180,
    },
    {
      field: 'createTime',
      title: '任务开始时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '任务结束时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '审批状态',
      minWidth: 180,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_TASK_STATUS },
      },
    },
    {
      field: 'reason',
      title: '审批建议',
      minWidth: 180,
    },
    {
      field: 'durationInMillis',
      title: '耗时',
      minWidth: 180,
      formatter: ({ row }) => {
        return `${formatPast2(row.durationInMillis)}`;
      },
    },
    {
      field: 'processInstanceId',
      title: '流程编号',
      minWidth: 280,
    },
    {
      field: 'id',
      title: '任务编号',
      minWidth: 280,
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 120,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '流程名称',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'history',
            text: '历史',
          },
        ],
      },
    },
  ];
}
