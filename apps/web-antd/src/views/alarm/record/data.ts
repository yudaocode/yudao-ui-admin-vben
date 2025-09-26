import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RecordApi } from '#/api/alarm/record';

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
      fieldName: 'sourceType',
      label: '报警来源类型',
      rules: 'required',
      component: 'ApiSelect',
      componentProps: {
        options: getDictOptions(DICT_TYPE.ALARM_SOURCE_TYPE, 'string'),
        placeholder: '请选择报警来源类型',
      },
    },
    {
      fieldName: 'sourceId',
      label: '报警来源编号',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入报警来源编号',
      },
    },
    {
      fieldName: 'sourceName',
      label: '报警来源名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入报警来源名称',
      },
    },
    {
      fieldName: 'targetType',
      label: '报警目标类型',
      rules: 'required',
      component: 'ApiSelect',
      componentProps: {
        options: getDictOptions(DICT_TYPE.ALARM_SOURCE_TYPE, 'string'),
        placeholder: '请选择报警目标类型',
      },
    },
    {
      fieldName: 'targetId',
      label: '报警目标编号',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入报警目标编号',
      },
    },
    {
      fieldName: 'targetName',
      label: '报警目标名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入报警目标名称',
      },
    },
    {
      fieldName: 'type',
      label: '报警类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: [],
        placeholder: '请选择报警类型',
      },
    },
    {
      fieldName: 'level',
      label: '报警级别',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入报警级别',
      },
    },
    {
      fieldName: 'reason',
      label: '报警原因',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入报警原因',
      },
    },
    {
      fieldName: 'initialAlarmTime',
      label: '初始报警时间',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'latestAlarmTime',
      label: '最近报警时间',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'viewTime',
      label: '查看时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'confirm',
      label: '确认时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'handleTime',
      label: '处理时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'suspendTime',
      label: '暂停时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'resumeTime',
      label: '恢复时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'completeTime',
      label: '完成时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'archiveTime',
      label: '归档时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'status',
      label: '报警状态',
      rules: 'required',
      component: 'RadioGroup',
      componentProps: {
        options: [],
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'sourceType',
      label: '报警来源类型',
      component: 'ApiSelect',
      componentProps: {
        options: getDictOptions(DICT_TYPE.ALARM_SOURCE_TYPE, 'string'),
        allowClear: true,
        placeholder: '请选择报警来源类型',
      },
    },
    {
      fieldName: 'sourceId',
      label: '报警来源编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入报警来源编号',
      },
    },
    {
      fieldName: 'sourceName',
      label: '报警来源名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入报警来源名称',
      },
    },
    {
      fieldName: 'targetType',
      label: '报警目标类型',
      component: 'ApiSelect',
      componentProps: {
        options: getDictOptions(DICT_TYPE.ALARM_SOURCE_TYPE, 'string'),
        allowClear: true,
        placeholder: '请选择报警目标类型',
      },
    },
    {
      fieldName: 'targetId',
      label: '报警目标编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入报警目标编号',
      },
    },
    {
      fieldName: 'targetName',
      label: '报警目标名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入报警目标名称',
      },
    },
    {
      fieldName: 'type',
      label: '报警类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择报警类型',
      },
    },
    {
      fieldName: 'level',
      label: '报警级别',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入报警级别',
      },
    },
    {
      fieldName: 'reason',
      label: '报警原因',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入报警原因',
      },
    },
    {
      fieldName: 'initialAlarmTime',
      label: '初始报警时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'latestAlarmTime',
      label: '最近报警时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'viewTime',
      label: '查看时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'confirm',
      label: '确认时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'handleTime',
      label: '处理时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'suspendTime',
      label: '暂停时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'resumeTime',
      label: '恢复时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'completeTime',
      label: '完成时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'archiveTime',
      label: '归档时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '报警状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择报警状态',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<RecordApi.Record>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'sourceType',
      title: '报警来源类型',
      minWidth: 120,
    },
    {
      field: 'sourceId',
      title: '报警来源编号',
      minWidth: 120,
    },
    {
      field: 'sourceName',
      title: '报警来源名称',
      minWidth: 120,
    },
    {
      field: 'targetType',
      title: '报警目标类型',
      minWidth: 120,
    },
    {
      field: 'targetId',
      title: '报警目标编号',
      minWidth: 120,
    },
    {
      field: 'targetName',
      title: '报警目标名称',
      minWidth: 120,
    },
    {
      field: 'type',
      title: '报警类型',
      minWidth: 120,
    },
    {
      field: 'level',
      title: '报警级别',
      minWidth: 120,
    },
    {
      field: 'reason',
      title: '报警原因',
      minWidth: 120,
    },
    {
      field: 'initialAlarmTime',
      title: '初始报警时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'latestAlarmTime',
      title: '最近报警时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'viewTime',
      title: '查看时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'confirm',
      title: '确认时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'handleTime',
      title: '处理时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'suspendTime',
      title: '暂停时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'resumeTime',
      title: '恢复时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'completeTime',
      title: '完成时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'archiveTime',
      title: '归档时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '报警状态',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
