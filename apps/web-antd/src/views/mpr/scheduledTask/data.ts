import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ScheduledTaskApi } from '#/api/mpr/scheduledTask';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'taskId',
      label: '任务ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务ID',
      },
    },
    {
      fieldName: 'description',
      label: '说明',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入说明',
      },
    },
    {
      fieldName: 'taskData',
      label: '任务数据',
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务数据',
      },
    },
    {
      fieldName: 'assignmentHandler',
      label: 'assignment_handler',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入assignment_handler',
      },
    },
    {
      fieldName: 'targetQueue',
      label: 'target_queue',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入target_queue',
      },
    },
    {
      fieldName: 'taskMsgPersistent',
      label: 'task_msg_persistent',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'timezone',
      label: '时区',
      component: 'Input',
      componentProps: {
        placeholder: '请输入时区',
      },
    },
    {
      fieldName: 'region',
      label: '区域',
      component: 'Input',
      componentProps: {
        placeholder: '请输入区域',
      },
    },
    {
      fieldName: 'cityId',
      label: '城市ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入城市ID',
      },
    },
    {
      fieldName: 'createdAt',
      label: '创建时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'updatedAt',
      label: '更新时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'updateHistory',
      label: '更新历史',
      component: 'Input',
      componentProps: {
        placeholder: '请输入更新历史',
      },
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'executeTimeRange',
      label: '执行时间范围',
      component: 'Input',
      componentProps: {
        placeholder: '请输入执行时间范围',
      },
    },
    {
      fieldName: 'frequency',
      label: '频率',
      component: 'Input',
      componentProps: {
        placeholder: '请输入频率',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: [],
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'priority',
      label: '优先级',
      component: 'Input',
      componentProps: {
        placeholder: '请输入优先级',
      },
    },
    {
      fieldName: 'executeCount',
      label: '执行次数',
      component: 'Input',
      componentProps: {
        placeholder: '请输入执行次数',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'taskId',
      label: '任务ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入任务ID',
      },
    },
    {
      fieldName: 'timezone',
      label: '时区',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入时区',
      },
    },
    {
      fieldName: 'region',
      label: '区域',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入区域',
      },
    },
    {
      fieldName: 'cityId',
      label: '城市ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入城市ID',
      },
    },
    {
      fieldName: 'createdAt',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<ScheduledTaskApi.ScheduledTask>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: 'ID',
      minWidth: 120,
    },
    {
      field: 'taskId',
      title: '任务ID',
      minWidth: 120,
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 120,
    },
    {
      field: 'taskData',
      title: '任务数据',
      minWidth: 120,
    },
    {
      field: 'assignmentHandler',
      title: 'assignment_handler',
      minWidth: 120,
    },
    {
      field: 'targetQueue',
      title: 'target_queue',
      minWidth: 120,
    },
    {
      field: 'taskMsgPersistent',
      title: 'task_msg_persistent',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'timezone',
      title: '时区',
      minWidth: 120,
    },
    {
      field: 'region',
      title: '区域',
      minWidth: 120,
    },
    {
      field: 'cityId',
      title: '城市ID',
      minWidth: 120,
    },
    {
      field: 'createdAt',
      title: '创建时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'updatedAt',
      title: '更新时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'updateHistory',
      title: '更新历史',
      minWidth: 120,
    },
    {
      field: 'startTime',
      title: '开始时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '结束时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'executeTimeRange',
      title: '执行时间范围',
      minWidth: 120,
    },
    {
      field: 'frequency',
      title: '频率',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 120,
    },
    {
      field: 'priority',
      title: '优先级',
      minWidth: 120,
    },
    {
      field: 'executeCount',
      title: '执行次数',
      minWidth: 120,
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
