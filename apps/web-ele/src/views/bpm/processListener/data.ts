import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  BPM_PROCESS_LISTENER_EXECUTION_EVENT_OPTIONS,
  BPM_PROCESS_LISTENER_TASK_EVENT_OPTIONS,
  CommonStatusEnum,
  DICT_TYPE,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  let prevValueType: string | undefined;

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
      fieldName: 'name',
      label: '名字',
      component: 'Input',
      componentProps: {
        placeholder: '请输入名字',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'type',
      label: '类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.BPM_PROCESS_LISTENER_TYPE, 'string'),
        placeholder: '请选择类型',
        clearable: true,
      },
      rules: 'required',
    },
    {
      fieldName: 'event',
      label: '事件',
      component: 'Select',
      componentProps: {
        options: BPM_PROCESS_LISTENER_TASK_EVENT_OPTIONS,
        placeholder: '请选择事件',
        clearable: true,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['type'],
        trigger: (values, actions) => {
          const options =
            values.type === 'execution'
              ? BPM_PROCESS_LISTENER_EXECUTION_EVENT_OPTIONS
              : BPM_PROCESS_LISTENER_TASK_EVENT_OPTIONS;
          if (
            values.event &&
            !options.some((opt) => opt.value === values.event)
          ) {
            actions.setFieldValue('event', undefined);
          }
        },
        componentProps: (values) => ({
          options:
            values.type === 'execution'
              ? BPM_PROCESS_LISTENER_EXECUTION_EVENT_OPTIONS
              : BPM_PROCESS_LISTENER_TASK_EVENT_OPTIONS,
        }),
      },
    },
    {
      fieldName: 'valueType',
      label: '值类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE,
          'string',
        ),
        placeholder: '请选择值类型',
        clearable: true,
      },
      rules: 'required',
    },
    {
      fieldName: 'value',
      label: '类路径|表达式',
      component: 'Input',
      rules: 'required',
      dependencies: {
        triggerFields: ['valueType'],
        trigger: (values, actions) => {
          if (
            prevValueType &&
            values.valueType &&
            prevValueType !== values.valueType
          ) {
            actions.setFieldValue('value', undefined);
          }
          prevValueType = values.valueType;
        },
        componentProps: (values) => ({
          placeholder:
            values.valueType === 'class' ? '请输入类路径' : '请输入表达式',
        }),
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '名字',
      component: 'Input',
      componentProps: {
        placeholder: '请输入名字',
        clearable: true,
      },
    },
    {
      fieldName: 'type',
      label: '类型',
      component: 'Select',
      componentProps: {
        placeholder: '请选择类型',
        options: getDictOptions(DICT_TYPE.BPM_PROCESS_LISTENER_TYPE, 'string'),
        clearable: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      minWidth: 100,
    },
    {
      field: 'name',
      title: '名字',
      minWidth: 200,
    },
    {
      field: 'type',
      title: '类型',
      minWidth: 200,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_LISTENER_TYPE },
      },
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'event',
      title: '事件',
      minWidth: 200,
    },
    {
      field: 'valueType',
      title: '值类型',
      minWidth: 200,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE },
      },
    },
    {
      field: 'value',
      title: '值',
      minWidth: 200,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
